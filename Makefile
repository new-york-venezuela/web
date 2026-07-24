.PHONY: setup run test clean help

help:
	@echo "Available targets:"
	@echo "  make setup    - Create .venv and install dependencies"
	@echo "  make run      - Run blog generator locally"
	@echo "  make test     - Run pytest on scripts/"
	@echo "  make clean    - Remove .venv and cache"

setup:
	@echo "Creating .venv with Python 3.12.3 using uv..."
	uv venv --python 3.12.3
	@echo "Installing dependencies via uv..."
	.venv/bin/uv pip install -r requirements.txt
	@echo "✓ Setup complete. Run 'source .venv/bin/activate' to activate."

run:
	@echo "Running blog generator..."
	.venv/bin/python scripts/generate_blog.py

test:
	@echo "Running tests..."
	.venv/bin/python -m pytest scripts/tests/ -v

clean:
	@echo "Removing .venv and cache..."
	rm -rf .venv __pycache__ .pytest_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +
	@echo "✓ Clean complete."
