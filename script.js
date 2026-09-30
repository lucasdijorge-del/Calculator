const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");
const buttons = document.querySelectorAll(".key");

let expression = "";
let justCalculated = false;

const operators = ["+", "-", "*", "/"];

buttons.forEach((button) => {
    button.addEventListener("click", () => {
        const value = button.dataset.value;
        const action = button.dataset.action;

        if (action) {
            handleAction(action);
            return;
        }

        if (value !== undefined) {
            handleInput(value);
        }
    });
});

function handleAction(action) {
    switch (action) {
        case "clear":
            clearCalculator();
            break;

        case "delete":
            deleteLast();
            break;

        case "percentage":
            percentage();
            break;

        case "calculate":
            calculate();
            break;
    }
}

function handleInput(value) {
    if (justCalculated && !operators.includes(value)) {
        expression = "";
        expressionDisplay.textContent = "";
        justCalculated = false;
    }

    if (justCalculated && operators.includes(value)) {
        justCalculated = false;
    }

    if (isNumber(value)) {
        addNumber(value);
        return;
    }

    if (value === ".") {
        addDecimal();
        return;
    }

    if (operators.includes(value)) {
        addOperator(value);
    }
}

function addNumber(number) {
    const currentNumber = getCurrentNumber();

    if (currentNumber === "0" && number === "0") {
        return;
    }

    expression += number;
    updateDisplay();
}

function addDecimal() {
    const currentNumber = getCurrentNumber();

    if (currentNumber.includes(".")) {
        return;
    }

    if (currentNumber === "" || currentNumber === "0" && expression === "") {
        expression += "0.";
    } else {
        expression += ".";
    }

    updateDisplay();
}

function addOperator(operator) {
    if (expression === "") {
        if (operator === "-") {
            expression = "-";
            updateDisplay();
        }
        return;
    }

    const lastCharacter = expression[expression.length - 1];

    if (operators.includes(lastCharacter)) {
        expression = expression.slice(0, -1) + operator;
        updateDisplay();
        return;
    }

    expression += operator;
    updateDisplay();
}

function clearCalculator() {
    expression = "";
    justCalculated = false;
    expressionDisplay.textContent = "";
    display.textContent = "0";
}

function deleteLast() {
    if (justCalculated) {
        clearCalculator();
        return;
    }

    expression = expression.slice(0, -1);
    updateDisplay();

    if (expression === "") {
        display.textContent = "0";
    }
}

function percentage() {
    if (expression === "") {
        return;
    }

    const currentNumber = getCurrentNumber();

    if (currentNumber === "" || currentNumber === "-") {
        return;
    }

    const startIndex = expression.length - currentNumber.length;
    const number = parseFloat(currentNumber);

    if (Number.isNaN(number)) {
        return;
    }

    const percentageValue = number / 100;

    expression = expression.substring(0, startIndex) + percentageValue;
    updateDisplay();
}

function calculate() {
    if (expression === "") {
        return;
    }

    const lastCharacter = expression[expression.length - 1];

    if (operators.includes(lastCharacter)) {
        return;
    }

    try {
        const result = evaluateExpression(expression);

        if (!Number.isFinite(result)) {
            throw new Error("Resultado inválido");
        }

        expressionDisplay.textContent = formatExpression(expression) + " =";
        display.textContent = formatNumber(result);
        expression = String(result);
        justCalculated = true;
    } catch (error) {
        display.textContent = "Erro";
        expressionDisplay.textContent = "Expressão inválida";
        expression = "";
        justCalculated = false;
    }
}

function evaluateExpression(input) {
    const tokens = tokenize(input);
    const postfix = convertToPostfix(tokens);
    return evaluatePostfix(postfix);
}

function tokenize(input) {
    const tokens = [];
    let number = "";

    for (let index = 0; index < input.length; index++) {
        const character = input[index];

        if (isNumber(character) || character === ".") {
            number += character;
            continue;
        }

        if (operators.includes(character)) {
            if (character === "-" && number === "" && tokens.length === 0) {
                number = "-";
                continue;
            }

            if (number !== "") {
                tokens.push(parseFloat(number));
                number = "";
            }

            tokens.push(character);
        }
    }

    if (number !== "") {
        tokens.push(parseFloat(number));
    }

    return tokens;
}

function convertToPostfix(tokens) {
    const output = [];
    const operatorStack = [];

    const precedence = {
        "+": 1,
        "-": 1,
        "*": 2,
        "/": 2
    };

    tokens.forEach((token) => {
        if (typeof token === "number") {
            output.push(token);
            return;
        }

        while (
            operatorStack.length > 0 &&
            precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
        ) {
            output.push(operatorStack.pop());
        }

        operatorStack.push(token);
    });

    while (operatorStack.length > 0) {
        output.push(operatorStack.pop());
    }

    return output;
}

function evaluatePostfix(tokens) {
    const stack = [];

    tokens.forEach((token) => {
        if (typeof token === "number") {
            stack.push(token);
            return;
        }

        const second = stack.pop();
        const first = stack.pop();

        if (first === undefined || second === undefined) {
            throw new Error("Expressão inválida");
        }

        let result;

        switch (token) {
            case "+":
                result = first + second;
                break;

            case "-":
                result = first - second;
                break;

            case "*":
                result = first * second;
                break;

            case "/":
                if (second === 0) {
                    throw new Error("Divisão por zero");
                }
                result = first / second;
                break;

            default:
                throw new Error("Operador inválido");
        }

        stack.push(result);
    });

    if (stack.length !== 1) {
        throw new Error("Expressão inválida");
    }

    return stack[0];
}

function getCurrentNumber() {
    let index = expression.length - 1;

    while (index >= 0 && !operators.includes(expression[index])) {
        index--;
    }

    return expression.substring(index + 1);
}

function isNumber(value) {
    return /^\d$/.test(value);
}

function updateDisplay() {
    if (expression === "") {
        display.textContent = "0";
        return;
    }

    display.textContent = formatExpression(expression);
}

function formatExpression(value) {
    return value
        .replaceAll("*", " × ")
        .replaceAll("/", " ÷ ")
        .replaceAll("+", " + ")
        .replaceAll("-", " − ");
}

function formatNumber(number) {
    if (Math.abs(number) >= 1e12 || (Math.abs(number) > 0 && Math.abs(number) < 1e-9)) {
        return number.toExponential(6);
    }

    const rounded = Number(number.toFixed(10));
    return String(rounded);
}

document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (/^\d$/.test(key)) {
        handleInput(key);
        return;
    }

    if (key === "+" || key === "-" || key === "*" || key === "/") {
        handleInput(key);
        return;
    }

    if (key === ".") {
        handleInput(".");
        return;
    }

    if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
        return;
    }

    if (key === "Backspace") {
        deleteLast();
        return;
    }

    if (key === "Escape") {
        clearCalculator();
        return;
    }

    if (key === "%") {
        percentage();
    }
});

clearCalculator();
