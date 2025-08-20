# Sample Python code for testing selection
def fibonacci(n):
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

@decorator
def cached_function(func):
    """Simple caching decorator."""
    cache = {}
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrapper

class Calculator:
    def __init__(self, precision=2):
        self.precision = precision
    
    def calculate(self, operation, a, b):
        if operation == "add":
            return round(a + b, self.precision)
        elif operation == "multiply":
            return round(a * b, self.precision)
        else:
            raise ValueError(f"Unknown operation: {operation}")