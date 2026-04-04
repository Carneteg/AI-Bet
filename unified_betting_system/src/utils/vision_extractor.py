import os
import base64
import json
import requests
from typing import List, Dict, Any

class VisionExtractor:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        
        self.system_prompt = """
        Du är en expert på att extrahera matchinformation från bilder.
        Returnera ALLTID giltig JSON med formatet {"matches": [...]}.
        För varje match: home_team, away_team, home_win_prob (0-1), draw_prob (0-1), away_win_prob (0-1), 
        home_odds, draw_odds, away_odds, home_streck (0-100), draw_streck, away_streck.
        """

    def _encode_image(self, image_path: str) -> str:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def extract_from_image(self, image_path: str) -> List[Dict[str, Any]]:
        if not self.openai_key and not self.anthropic_key:
            raise ValueError("No API keys found for vision extraction (OpenAI/Anthropic).")

        base64_image = self._encode_image(image_path)
        
        # Prefer Anthropic Claude 3.5 Sonnet if available
        if self.anthropic_key:
            return self._extract_anthropic(base64_image)
        else:
            return self._extract_openai(base64_image)

    def _extract_anthropic(self, base64_image: str) -> List[Dict[str, Any]]:
        headers = {
            "content-type": "application/json",
            "x-api-key": self.anthropic_key,
            "anthropic-version": "2023-06-01"
        }
        payload = {
            "model": "claude-3-5-sonnet-20240620",
            "max_tokens": 4096,
            "system": self.system_prompt,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": base64_image
                            }
                        },
                        {"type": "text", "text": "Extrahera matchdata från bilden till JSON."}
                    ]
                }
            ]
        }
        res = requests.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
        res.raise_for_status()
        content = res.json()["content"][0]["text"]
        return self._parse_json(content)

    def _extract_openai(self, base64_image: str) -> List[Dict[str, Any]]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.openai_key}"
        }
        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extrahera matchdata från bilden till JSON."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            "max_tokens": 4096,
            "response_format": {"type": "json_object"}
        }
        res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        res.raise_for_status()
        content = res.json()["choices"][0]["message"]["content"]
        return self._parse_json(content)

    def _parse_json(self, text: str) -> List[Dict[str, Any]]:
        clean = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        return data.get("matches", [])
