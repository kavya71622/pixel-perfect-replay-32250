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
        self.assertIn('http://localhost:5173', origins)
        self.assertNotIn('*', origins)


if __name__ == '__main__':
    unittest.main()