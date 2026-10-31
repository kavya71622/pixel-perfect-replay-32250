import ast
import os
import unittest
from pathlib import Path
from unittest.mock import patch


class CorsConfigurationTests(unittest.TestCase):
    def test_published_origin_is_allowed_even_with_local_override(self):
        # Evaluate the actual configuration without requiring a running Ollama model.
        tree = ast.parse(Path(__file__).with_name('main.py').read_text())
        assignment = next(node for node in tree.body if isinstance(node, ast.Assign)
                          and any(isinstance(t, ast.Name) and t.id == 'origins' for t in node.targets))
        with patch.dict(os.environ, {'CORS_ORIGINS': 'http://localhost:5173'}):
            origins = eval(compile(ast.Expression(assignment.value), 'main.py', 'eval'), {'os': os})
        self.assertIn('https://pixel-perfect-replay-32250.lovable.app', origins)
        self.assertIn('https://ebae88fd-9732-4db5-aea2-8bc803e04a1e.lovableproject.com', origins)
        self.assertIn('http://localhost:5173', origins)
        self.assertNotIn('*', origins)

    def test_real_preflight_and_error_responses(self):
        from fastapi import FastAPI
        from fastapi.middleware.cors import CORSMiddleware
        from fastapi.testclient import TestClient
        tree = ast.parse(Path(__file__).with_name('main.py').read_text())
        assignment = next(node for node in tree.body if isinstance(node, ast.Assign)
                          and any(isinstance(t, ast.Name) and t.id == 'origins' for t in node.targets))
        origins = eval(compile(ast.Expression(assignment.value), 'main.py', 'eval'), {'os': os})
        inner = FastAPI()
        @inner.post('/api/analyze')
        def fail():
            raise RuntimeError('Test error')
        client = TestClient(CORSMiddleware(inner, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*']), raise_server_exceptions=False)
        for origin in ['https://pixel-perfect-replay-32250.lovable.app', 'https://ebae88fd-9732-4db5-aea2-8bc803e04a1e.lovableproject.com']:
            preflight = client.options('/api/analyze', headers={'Origin': origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type'})
            self.assertEqual(preflight.status_code, 200)
            self.assertEqual(preflight.headers['access-control-allow-origin'], origin)
            self.assertIn('POST', preflight.headers['access-control-allow-methods'])
            self.assertIn('authorization', preflight.headers['access-control-allow-headers'])
            response = client.post('/api/analyze', headers={'Origin': origin})
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.headers['access-control-allow-origin'], origin)
        self.assertEqual(client.options('/api/analyze', headers={'Origin': 'https://untrusted.example', 'Access-Control-Request-Method': 'POST'}).status_code, 400)


if __name__ == '__main__':
    unittest.main()