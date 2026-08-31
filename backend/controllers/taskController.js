let tasks = [];

const getTasks = (req, res) => {
    res.status(200).json(tasks);
};

const createTask = (req, res) => {
    const newTask = req.body;
    newTask.id = Date.now();
    tasks.push(newTask);
    
    res.status(201).json(newTask);
};

const updateTask = (req, res) => {
    const taskId = req.params.id;
    const taskIndex = tasks.findIndex(t => t.id == taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found" });
    }

    tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
    res.status(200).json(tasks[taskIndex]);
};


const deleteTask = (req, res) => {
    const taskId = req.params.id;
    
    tasks = tasks.filter(t => t.id != taskId);
    res.status(200).json({ message: "Task deleted successfully" });
};

module.exports = { getTasks, createTask, updateTask, deleteTask };