from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import os

app = FastAPI(
    title="InterviewAI NLP Service",
    description="FastAPI service for resume matching, keyword extraction, and semantic answer evaluation",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy global model loaders
nlp = None
transformer_model = None

def load_nlp_models():
    global nlp, transformer_model
    
    # 1. Load spaCy English Model
    if nlp is None:
        try:
            import spacy
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Downloading 'en_core_web_sm' spaCy model...")
            os.system("python -m spacy download en_core_web_sm")
            import spacy
            nlp = spacy.load("en_core_web_sm")
        except ImportError:
            print("spaCy library not installed. Skipping spaCy components.")

    # 2. Load Sentence Transformer Model
    if transformer_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("Loading 'all-MiniLM-L6-v2' sentence-transformers model...")
            transformer_model = SentenceTransformer("all-MiniLM-L6-v2")
        except ImportError:
            print("sentence-transformers library not installed. Skipping embeddings components.")

@app.on_event("startup")
def startup_event():
    load_nlp_models()

class EvaluationRequest(BaseModel):
    userAnswer: str
    idealAnswer: str

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "InterviewAI NLP Microservice",
        "timestamp": time.time()
    }

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "dependencies": {
            "spacy_loaded": nlp is not None,
            "transformer_model_loaded": transformer_model is not None
        }
    }

@app.post("/evaluate")
def evaluate_response(req: EvaluationRequest):
    # Ensure models are loaded
    load_nlp_models()

    if not req.userAnswer.strip() or not req.idealAnswer.strip():
        return {
            "similarityScore": 0.0,
            "keywordOverlap": 0.0,
            "matchedKeywords": [],
            "missingKeywords": []
        }

    similarity_score = 0.0
    # 1. Embeddings similarity comparison (using sentence-transformers)
    if transformer_model is not None:
        try:
            from sentence_transformers import util
            
            # Compute embeddings
            emb_user = transformer_model.encode(req.userAnswer, convert_to_tensor=True)
            emb_ideal = transformer_model.encode(req.idealAnswer, convert_to_tensor=True)
            
            # Compute cosine similarity
            cos_sim = util.cos_sim(emb_user, emb_ideal)
            similarity_score = float(cos_sim[0][0])
            
            # Bound negative similarities to 0
            similarity_score = max(0.0, similarity_score)
        except Exception as e:
            print(f"Error calculating embeddings similarity: {e}")
            similarity_score = 0.0

    matched_keywords = []
    missing_keywords = []
    overlap_percentage = 0.0

    # 2. Keyword analysis (using spaCy token extraction)
    if nlp is not None:
        try:
            doc_user = nlp(req.userAnswer.lower())
            doc_ideal = nlp(req.idealAnswer.lower())
            
            # Extract lemmatized nouns, verbs, adjectives, and proper nouns
            # Filtering out stop words and basic punctuations
            pos_targets = {"NOUN", "PROPN", "ADJ", "VERB"}
            
            keywords_ideal = {
                token.lemma_ for token in doc_ideal 
                if token.pos_ in pos_targets and not token.is_stop and not token.is_punct
            }
            
            keywords_user = {
                token.lemma_ for token in doc_user 
                if token.pos_ in pos_targets and not token.is_stop and not token.is_punct
            }

            if keywords_ideal:
                matched_set = keywords_ideal.intersection(keywords_user)
                missing_set = keywords_ideal.difference(keywords_user)
                
                matched_keywords = sorted(list(matched_set))
                missing_keywords = sorted(list(missing_set))
                
                overlap_percentage = len(matched_set) / len(keywords_ideal)
            else:
                overlap_percentage = 1.0
        except Exception as e:
            print(f"Error executing keyword extraction: {e}")
            overlap_percentage = 0.0

    return {
        "similarityScore": round(similarity_score * 100, 1),
        "keywordOverlap": round(overlap_percentage * 100, 1),
        "matchedKeywords": matched_keywords,
        "missingKeywords": missing_keywords
    }
