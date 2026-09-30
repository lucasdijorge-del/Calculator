const STORAGE_KEY = "taskflow.tasks.v1";
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyDescription = document.querySelector("#empty-description");
const errorMessage = document.querySelector("#error-message");
const characterCount = document.querySelector("#character-count");
const clearCompletedButton = document.querySelector("#clear-completed");
const filterButtons = [...document.querySelectorAll(".filter-button")];

let tasks = loadTasks();
let currentFilter = "all";

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short"
}).format(new Date()).replaceAll(".", "");

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = input.value.trim();

    if (!title) {
        errorMessage.textContent = "Escreva uma tarefa antes de adicionar.";
        input.focus();
        return;
    }

    tasks.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        title,
        completed: false,
        createdAt: Date.now()
    });
    input.value = "";
    characterCount.textContent = "0/100";
    errorMessage.textContent = "";
    saveAndRender();
    input.focus();
});

input.addEventListener("input", () => {
    characterCount.textContent = `${input.value.length}/100`;
    if (input.value.trim()) errorMessage.textContent = "";
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        filterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });
        render();
    });
});

list.addEventListener("change", (event) => {
    if (!event.target.matches(".task-checkbox")) return;
    const task = tasks.find((item) => item.id === event.target.dataset.id);
    if (!task) return;
    task.completed = event.target.checked;
    saveAndRender();
});

list.addEventListener("click", (event) => {
    const button = event.target.closest(".task-action");
    if (!button) return;
    tasks = tasks.filter((task) => task.id !== button.dataset.id);
    saveAndRender();
});

clearCompletedButton.addEventListener("click", () => {
    tasks = tasks.filter((task) => !task.completed);
    saveAndRender();
});

function loadTasks() {
    try {
        const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(savedTasks)
            ? savedTasks.filter((task) => task && typeof task.id === "string" && typeof task.title === "string")
            : [];
    } catch {
        return [];
    }
}

function saveAndRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    render();
}

function render() {
    const completedCount = tasks.filter((task) => task.completed).length;
    const pendingCount = tasks.length - completedCount;
    const visibleTasks = tasks.filter((task) => {
        if (currentFilter === "pending") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    document.querySelector("#total-tasks").textContent = tasks.length;
    document.querySelector("#pending-tasks").textContent = pendingCount;
    document.querySelector("#completed-tasks").textContent = completedCount;
    document.querySelector("#task-count-label").textContent = `${tasks.length} ${tasks.length === 1 ? "tarefa" : "tarefas"}`;
    clearCompletedButton.disabled = completedCount === 0;

    list.replaceChildren(...visibleTasks.map(createTaskElement));
    emptyState.hidden = visibleTasks.length > 0;

    if (tasks.length === 0) {
        emptyTitle.textContent = "Sua lista começa aqui";
        emptyDescription.textContent = "Adicione uma tarefa e dê o primeiro passo.";
    } else if (visibleTasks.length === 0) {
        emptyTitle.textContent = "Nenhuma tarefa por aqui";
        emptyDescription.textContent = currentFilter === "completed"
            ? "As tarefas concluídas aparecerão aqui."
            : "Você não tem tarefas pendentes. Bom trabalho!";
    }
}

function createTaskElement(task) {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " is-completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.dataset.id = task.id;
    checkbox.setAttribute("aria-label", `Marcar como ${task.completed ? "pendente" : "concluída"}: ${task.title}`);

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const createdAt = document.createElement("time");
    createdAt.className = "task-created";
    createdAt.dateTime = new Date(task.createdAt).toISOString();
    createdAt.textContent = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(task.createdAt);

    const removeButton = document.createElement("button");
    removeButton.className = "task-action";
    removeButton.type = "button";
    removeButton.dataset.id = task.id;
    removeButton.setAttribute("aria-label", `Remover tarefa: ${task.title}`);
    removeButton.textContent = "×";

    item.append(checkbox, title, createdAt, removeButton);
    return item;
}

render();