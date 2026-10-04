import os
import asyncio
import logging
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from app.config import settings

logger = logging.getLogger(__name__)

async def index_transcript(meeting_id: str, transcript_path: str):
    """
    RAG Pipeline: Loads the transcript, chunks it, generates embeddings using Google Gemini,
    and stores it in a local Chroma vector database.
    """
    logger.info(f"Starting indexing for meeting {meeting_id}...")
    if not os.path.exists(transcript_path) or os.path.getsize(transcript_path) == 0:
        logger.error("Transcript file is missing or empty.")
        return

    try:
        loader = TextLoader(transcript_path, encoding='utf-8')
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50, length_function=len)
        splits = text_splitter.split_documents(docs)
        logger.info(f"Split transcript into {len(splits)} chunks.")
        
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("GEMINI_API_KEY is not set.")
            return
            
        embeddings = GoogleGenerativeAIEmbeddings(model=settings.EMBEDDING_MODEL, google_api_key=api_key)
        
        await asyncio.to_thread(
            Chroma.from_documents,
            documents=splits,
            embedding=embeddings,
            collection_name=f"meeting_{meeting_id}",
            persist_directory=settings.CHROMADB_DIR
        )
        logger.info(f"Successfully indexed transcript into ChromaDB at {settings.CHROMADB_DIR}")

        # Notify Node.js Backend that meeting is fully processed and save transcript path
        import requests
        try:
            requests.patch(f"http://127.0.0.1:3001/api/v1/meetings/{meeting_id}/internal-update", json={
                "status": "Completed",
                "transcriptPath": transcript_path
            })
            logger.info("Successfully updated meeting status in backend database.")
        except Exception as patch_e:
            logger.error(f"Failed to update backend status: {patch_e}")

    except Exception as e:
        logger.error(f"Error during indexing: {e}")

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

async def query_transcript(meeting_id: str, query: str) -> str:
    """
    Retrieves relevant chunks from ChromaDB and uses an LLM to answer the user's question.
    """
    try:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return "Error: Please set GEMINI_API_KEY in your environment config to use the chat feature."
            
        embeddings = GoogleGenerativeAIEmbeddings(model=settings.EMBEDDING_MODEL, google_api_key=api_key)
        
        # Load existing vectorstore
        vectorstore = Chroma(
            collection_name=f"meeting_{meeting_id}", 
            persist_directory=settings.CHROMADB_DIR, 
            embedding_function=embeddings
        )
        
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        
        llm = ChatGoogleGenerativeAI(model=settings.CHAT_MODEL, google_api_key=api_key)
        
        system_prompt = (
            "You are an AI assistant analyzing a meeting transcript. "
            "Use the following pieces of retrieved context to answer the user's question. "
            "If you don't know the answer, just say that you don't know based on the transcript. "
            "Context: {context}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])
        
        rag_chain = (
            {"context": retriever | format_docs, "input": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        
        # Run chain in thread to not block event loop
        response = await asyncio.to_thread(rag_chain.invoke, query)
        return response
        
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        return f"Sorry, I encountered an error: {str(e)}"
