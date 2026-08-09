from contextlib import asynccontextmanager
import os
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# Global model instances
# ============================================================

nlp = None
transformer_model = None


# ============================================================
# Model loading
# ============================================================

def load_nlp_models():
    global nlp, transformer_model

    # 1. Load spaCy English model
    if nlp is None:
        try:
            import spacy

            print("Loading spaCy model: en_core_web_sm...")
            nlp = spacy.load("en_core_web_sm")
            print("✓ spaCy model loaded")

        except OSError:
            print("spaCy model 'en_core_web_sm' not found.")
            print("Downloading 'en_core_web_sm'...")

            exit_code = os.system(
                "python -m spacy download en_core_web_sm"
            )

            if exit_code != 0:
                print("✗ Failed to download spaCy model")
            else:
                import spacy
                nlp = spacy.load("en_core_web_sm")
                print("✓ spaCy model downloaded and loaded")

        except ImportError:
            print("✗ spaCy is not installed")

    # 2. Load Sentence Transformer model
    if transformer_model is None:
        try:
            from sentence_transformers import SentenceTransformer

            print("Loading Sentence Transformer: all-MiniLM-L6-v2...")
            transformer_model = SentenceTransformer(
                "all-MiniLM-L6-v2"
            )
            print("✓ Sentence Transformer loaded")

        except ImportError:
            print("✗ sentence-transformers is not installed")

        except Exception as e:
            print(f"✗ Failed to load Sentence Transformer: {e}")


# ============================================================
# FastAPI lifespan
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("")
    print("=" * 60)
    print("Starting InterviewAI NLP Service")
    print("=" * 60)

    load_nlp_models()

    print("=" * 60)
    print("NLP model initialization complete")
    print("=" * 60)
    print("")

    yield

    print("")
    print("Shutting down InterviewAI NLP Service...")


# ============================================================
# FastAPI application
# ============================================================

app = FastAPI(
    title="InterviewAI NLP Service",
    description=(
        "FastAPI service for resume matching, "
        "keyword extraction, and semantic answer evaluation"
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request models
# ============================================================

class EvaluationRequest(BaseModel):
    userAnswer: str
    idealAnswer: str


# ============================================================
# Health / root endpoints
# ============================================================

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "InterviewAI NLP Microservice",
        "timestamp": time.time(),
    }


@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "dependencies": {
            "spacy_loaded": nlp is not None,
            "transformer_model_loaded": transformer_model is not None,
        },
    }


# ============================================================
# Answer evaluation
# ============================================================

@app.post("/evaluate")
def evaluate_response(req: EvaluationRequest):
    global nlp, transformer_model

    # Make sure models are available even if startup loading failed.
    load_nlp_models()

    # Handle empty answers safely.
    if not req.userAnswer.strip() or not req.idealAnswer.strip():
        return {
            "similarityScore": 0.0,
            "keywordOverlap": 0.0,
            "matchedKeywords": [],
            "missingKeywords": [],
        }

    # --------------------------------------------------------
    # 1. Semantic similarity
    # --------------------------------------------------------

    similarity_score = 0.0

    if transformer_model is not None:
        try:
            from sentence_transformers import util

            emb_user = transformer_model.encode(
                req.userAnswer,
                convert_to_tensor=True,
            )

            emb_ideal = transformer_model.encode(
                req.idealAnswer,
                convert_to_tensor=True,
            )

            cos_sim = util.cos_sim(
                emb_user,
                emb_ideal,
            )

            similarity_score = float(cos_sim[0][0])

            # Prevent negative similarity scores.
            similarity_score = max(0.0, similarity_score)

        except Exception as e:
            print(
                f"Error calculating embedding similarity: {e}"
            )
            similarity_score = 0.0

    # --------------------------------------------------------
    # 2. Keyword analysis
    # --------------------------------------------------------

    matched_keywords = []
    missing_keywords = []
    overlap_percentage = 0.0

    if nlp is not None:
        try:
            doc_user = nlp(
                req.userAnswer.lower()
            )

            doc_ideal = nlp(
                req.idealAnswer.lower()
            )

            # Relevant parts of speech for interview answers.
            pos_targets = {
                "NOUN",
                "PROPN",
                "ADJ",
                "VERB",
            }

            keywords_ideal = {
                token.lemma_
                for token in doc_ideal
                if (
                    token.pos_ in pos_targets
                    and not token.is_stop
                    and not token.is_punct
                )
            }

            keywords_user = {
                token.lemma_
                for token in doc_user
                if (
                    token.pos_ in pos_targets
                    and not token.is_stop
                    and not token.is_punct
                )
            }

            if keywords_ideal:
                matched_set = (
                    keywords_ideal.intersection(
                        keywords_user
                    )
                )

                missing_set = (
                    keywords_ideal.difference(
                        keywords_user
                    )
                )

                matched_keywords = sorted(
                    list(matched_set)
                )

                missing_keywords = sorted(
                    list(missing_set)
                )

                overlap_percentage = (
                    len(matched_set)
                    / len(keywords_ideal)
                )

            else:
                # If the ideal answer contains no
                # meaningful keywords, treat it as full overlap.
                overlap_percentage = 1.0

        except Exception as e:
            print(
                f"Error executing keyword extraction: {e}"
            )
            overlap_percentage = 0.0

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "similarityScore": round(
            similarity_score * 100,
            1,
        ),
        "keywordOverlap": round(
            overlap_percentage * 100,
            1,
        ),
        "matchedKeywords": matched_keywords,
        "missingKeywords": missing_keywords,
    }


# ============================================================
# Local development entry point
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )