// JavaScript test code for selection injection testing
function calculateSum(arr) {
    return arr.reduce((sum, num) => sum + num, 0);
}

async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        throw error;
    }
}

class TaskManager {
    constructor() {
        this.tasks = [];
    }
    
    addTask(task) {
        this.tasks.push({ ...task, id: Date.now(), completed: false });
    }
    
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) task.completed = true;
    }
}

// Usage example
const numbers = [1, 2, 3, 4, 5];
const sum = calculateSum(numbers);
console.log(`Sum: ${sum}`);
