# Python test code for selection injection testing
def calculate_fibonacci(n):
    """Calculate fibonacci number using recursion."""
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

class DataProcessor:
    def __init__(self, data):
        self.data = data
    
    def process(self):
        return [x * 2 for x in self.data if x > 0]

# Test data
numbers = [1, -2, 3, -4, 5]
processor = DataProcessor(numbers)
result = processor.process()
print(f"Fibonacci of 10: {calculate_fibonacci(10)}")
print(f"Processed data: {result}")
