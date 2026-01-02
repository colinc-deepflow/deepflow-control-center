"""
Local LLM Service - Handles inference with locally hosted LLMs.
Supports Ollama, vLLM, llama.cpp, and OpenAI-compatible endpoints.
"""
import httpx
import json
import logging
from typing import Dict, Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class LocalLLMService:
    """Service for interacting with locally hosted LLMs."""

    def __init__(self):
        self.endpoint = settings.LOCAL_LLM_ENDPOINT
        self.llm_type = settings.LOCAL_LLM_TYPE
        self.timeout = settings.AI_REQUEST_TIMEOUT

    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate text using local LLM.

        Args:
            prompt: Input prompt
            model: Model name (e.g., "qwen2.5:72b")
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            **kwargs: Additional model-specific parameters

        Returns:
            Dict with 'text' and 'usage' keys
        """
        try:
            if self.llm_type == "ollama":
                return await self._generate_ollama(prompt, model, temperature, max_tokens)
            elif self.llm_type == "vllm":
                return await self._generate_vllm(prompt, model, temperature, max_tokens)
            elif self.llm_type == "llamacpp":
                return await self._generate_llamacpp(prompt, model, temperature, max_tokens)
            elif self.llm_type == "openai-compatible":
                return await self._generate_openai_compatible(prompt, model, temperature, max_tokens)
            else:
                raise ValueError(f"Unsupported LLM type: {self.llm_type}")

        except Exception as e:
            logger.error(f"Local LLM generation failed: {e}")
            raise

    async def _generate_ollama(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        """Generate text using Ollama."""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.endpoint}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                    }
                }
            )
            response.raise_for_status()
            data = response.json()

            return {
                "text": data.get("response", ""),
                "usage": {
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": data.get("eval_count", 0),
                    "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0)
                }
            }

    async def _generate_vllm(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        """Generate text using vLLM OpenAI-compatible server."""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.endpoint}/v1/completions",
                json={
                    "model": model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()

            return {
                "text": data["choices"][0]["text"],
                "usage": data.get("usage", {})
            }

    async def _generate_llamacpp(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        """Generate text using llama.cpp server."""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.endpoint}/completion",
                json={
                    "prompt": prompt,
                    "temperature": temperature,
                    "n_predict": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()

            # llama.cpp returns different format
            text = data.get("content", "")
            tokens_predicted = data.get("tokens_predicted", 0)
            tokens_evaluated = data.get("tokens_evaluated", 0)

            return {
                "text": text,
                "usage": {
                    "prompt_tokens": tokens_evaluated,
                    "completion_tokens": tokens_predicted,
                    "total_tokens": tokens_evaluated + tokens_predicted
                }
            }

    async def _generate_openai_compatible(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int
    ) -> Dict[str, Any]:
        """Generate text using OpenAI-compatible endpoint (Text Generation WebUI, etc.)."""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.endpoint}/v1/completions",
                json={
                    "model": model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()

            return {
                "text": data["choices"][0]["text"],
                "usage": data.get("usage", {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0
                })
            }

    async def health_check(self) -> bool:
        """Check if local LLM service is available."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                if self.llm_type == "ollama":
                    response = await client.get(f"{self.endpoint}/api/tags")
                else:
                    response = await client.get(f"{self.endpoint}/health")

                return response.status_code == 200
        except Exception as e:
            logger.warning(f"Local LLM health check failed: {e}")
            return False


# Global instance
local_llm = LocalLLMService()
