import random
import time

MCQ_BANK = {
    "python": {
        "beginner": [
            {"q": "What is the output of print(type([]))?", "options": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"], "answer": 0, "explanation": "[] creates a list object in Python."},
            {"q": "Which keyword is used to define a function in Python?", "options": ["func", "def", "function", "define"], "answer": 1, "explanation": "def is used to define functions in Python."},
            {"q": "What does len('Hello') return?", "options": ["4", "5", "6", "Error"], "answer": 1, "explanation": "len() counts characters. 'Hello' has 5 characters."},
            {"q": "Which of the following is immutable in Python?", "options": ["List", "Dictionary", "Tuple", "Set"], "answer": 2, "explanation": "Tuples are immutable — they cannot be modified after creation."},
            {"q": "What is the correct way to create a dictionary?", "options": ["d = []", "d = ()", "d = {}", "d = <>"], "answer": 2, "explanation": "Curly braces {} create a dictionary in Python."},
            {"q": "What does 'break' do in a loop?", "options": ["Skips current iteration", "Exits the loop", "Restarts the loop", "Pauses execution"], "answer": 1, "explanation": "break exits the current loop completely."},
            {"q": "How do you start a comment in Python?", "options": ["//", "/*", "#", "--"], "answer": 2, "explanation": "# starts a single-line comment in Python."},
            {"q": "What is the result of 10 // 3?", "options": ["3.33", "3", "4", "Error"], "answer": 1, "explanation": "// is floor division, returning the integer quotient."},
        ],
        "intermediate": [
            {"q": "What is a Python decorator?", "options": ["A class that inherits from another", "A function that wraps another function", "A type of variable", "A module import statement"], "answer": 1, "explanation": "Decorators are functions that wrap other functions to add functionality."},
            {"q": "What does *args do in a function?", "options": ["Accepts keyword arguments", "Accepts variable positional arguments", "Multiplies arguments", "None of the above"], "answer": 1, "explanation": "*args collects extra positional arguments as a tuple."},
            {"q": "Which built-in function converts a list to a set?", "options": ["list()", "set()", "dict()", "tuple()"], "answer": 1, "explanation": "set() converts an iterable to a set, removing duplicates."},
            {"q": "What is the output of [x**2 for x in range(3)]?", "options": ["[0, 1, 4]", "[1, 4, 9]", "[0, 2, 4]", "[1, 2, 3]"], "answer": 0, "explanation": "x**2 for x in [0,1,2] gives [0, 1, 4]."},
            {"q": "What keyword is used to yield values from a generator?", "options": ["return", "yield", "send", "next"], "answer": 1, "explanation": "yield pauses a function and returns a value, making it a generator."},
            {"q": "What is the purpose of __init__ in a class?", "options": ["Destructor", "Constructor / initializer", "Class method", "Static method"], "answer": 1, "explanation": "__init__ is called when an object is instantiated."},
        ],
        "advanced": [
            {"q": "What is the GIL in CPython?", "options": ["A memory manager", "Global Interpreter Lock", "A garbage collector", "A type checker"], "answer": 1, "explanation": "The GIL prevents multiple threads from executing Python bytecode simultaneously."},
            {"q": "Which method defines iteration behavior in a class?", "options": ["__iter__ and __next__", "__len__ and __getitem__", "__enter__ and __exit__", "__call__ and __str__"], "answer": 0, "explanation": "__iter__ returns the iterator and __next__ returns the next item."},
            {"q": "What is a metaclass?", "options": ["A class that inherits from object", "A class that creates classes", "An abstract class", "A singleton class"], "answer": 1, "explanation": "Metaclasses control how classes are created — they are 'classes of classes'."},
        ]
    },
    "javascript": {
        "beginner": [
            {"q": "Which symbol is used for single-line comments in JavaScript?", "options": ["#", "//", "/*", "--"], "answer": 1, "explanation": "// starts single-line comments in JavaScript."},
            {"q": "How do you declare a constant in JavaScript?", "options": ["var", "let", "const", "static"], "answer": 2, "explanation": "const declares a block-scoped constant."},
            {"q": "What does typeof null return?", "options": ["null", "undefined", "object", "string"], "answer": 2, "explanation": "typeof null returns 'object' — a well-known JavaScript quirk."},
            {"q": "Which method adds an element to the end of an array?", "options": ["push()", "pop()", "shift()", "unshift()"], "answer": 0, "explanation": "push() adds elements to the end of an array."},
            {"q": "What is the output of 2 + '3' in JavaScript?", "options": ["5", "23", "'23'", "Error"], "answer": 1, "explanation": "JS coerces 2 to a string and concatenates: '23'."},
        ],
        "intermediate": [
            {"q": "What is a closure in JavaScript?", "options": ["A function with no return value", "A function accessing its outer scope variables", "A sealed object", "An arrow function"], "answer": 1, "explanation": "Closures allow inner functions to access outer function variables."},
            {"q": "What does Promise.all() do?", "options": ["Runs promises sequentially", "Runs promises in parallel, fails if one fails", "Returns first resolved promise", "Ignores all rejections"], "answer": 1, "explanation": "Promise.all() runs promises in parallel and rejects if any promise rejects."},
            {"q": "What is event bubbling?", "options": ["Events trigger on parent before child", "Events trigger on child before parent", "Events propagate upward from child", "Events are cancelled"], "answer": 2, "explanation": "Events bubble up from target element to parent elements."},
            {"q": "What does the spread operator (...) do?", "options": ["Spreads array/object elements", "Multiplies values", "Creates a new function", "Merges two classes"], "answer": 0, "explanation": "The spread operator expands iterables into individual elements."},
        ],
        "advanced": [
            {"q": "What is the event loop's task queue also called?", "options": ["Microtask queue", "Macro task queue", "Call stack", "Heap"], "answer": 1, "explanation": "setTimeout and I/O callbacks go to the macro task queue."},
            {"q": "What is the Proxy object used for?", "options": ["Network proxies", "Intercepting object operations", "Async operations", "Prototype chains"], "answer": 1, "explanation": "Proxy allows you to intercept and customize object operations."},
        ]
    },
    "machine learning": {
        "beginner": [
            {"q": "What does 'training' a model mean?", "options": ["Writing code for the model", "Adjusting model parameters on data", "Deploying the model", "Testing the model"], "answer": 1, "explanation": "Training adjusts model parameters (weights) to minimize loss on training data."},
            {"q": "What is a feature in ML?", "options": ["A bug in the model", "An input variable used for prediction", "The final output", "A type of neural network"], "answer": 1, "explanation": "Features are input variables (columns) used by the model to make predictions."},
            {"q": "Which of these is a classification algorithm?", "options": ["Linear Regression", "K-Means", "Logistic Regression", "PCA"], "answer": 2, "explanation": "Logistic Regression is used for binary/multi-class classification."},
            {"q": "What does overfitting mean?", "options": ["Model performs well on test data", "Model memorizes training data, fails on new data", "Model has too few parameters", "Model converges too fast"], "answer": 1, "explanation": "Overfitting is when a model learns noise in training data and fails to generalize."},
        ],
        "intermediate": [
            {"q": "What is the purpose of cross-validation?", "options": ["Speed up training", "Reduce memory usage", "Evaluate generalization performance", "Increase model accuracy"], "answer": 2, "explanation": "Cross-validation estimates how the model will perform on unseen data."},
            {"q": "What is regularization used for?", "options": ["Speeding up training", "Preventing overfitting", "Normalizing data", "Data augmentation"], "answer": 1, "explanation": "Regularization adds a penalty to model complexity to prevent overfitting."},
            {"q": "What is the kernel trick in SVM?", "options": ["Speeds up computation", "Maps data to higher dimensions implicitly", "Reduces features", "Normalizes output"], "answer": 1, "explanation": "The kernel trick maps data to higher-dimensional spaces without computing coordinates explicitly."},
            {"q": "What does PCA stand for?", "options": ["Predictive Component Analysis", "Principal Component Analysis", "Partial Coefficient Approximation", "Polynomial Curve Adjustment"], "answer": 1, "explanation": "PCA reduces dimensionality by finding principal components."},
        ],
        "advanced": [
            {"q": "What is the vanishing gradient problem?", "options": ["Gradients become too large", "Gradients become too small in deep networks", "Loss function diverges", "Weights become negative"], "answer": 1, "explanation": "In deep networks, gradients shrink as they backpropagate, preventing learning in early layers."},
            {"q": "What is batch normalization?", "options": ["Normalizing input data", "Normalizing activations within a mini-batch", "Splitting data into batches", "Reducing batch size"], "answer": 1, "explanation": "Batch norm normalizes layer activations to stabilize and speed up training."},
        ]
    },
    "general": {
        "beginner": [
            {"q": "What does HTTP stand for?", "options": ["HyperText Transfer Protocol", "High Transfer Technology Protocol", "Hyper Text Transport Procedure", "Host Transfer Text Protocol"], "answer": 0, "explanation": "HTTP is the foundation of data communication on the web."},
            {"q": "What is an API?", "options": ["Application Performance Index", "Application Programming Interface", "Automated Protocol Integration", "Application Process Interface"], "answer": 1, "explanation": "An API is an interface that allows different software systems to communicate."},
            {"q": "What does SQL stand for?", "options": ["Simple Query Language", "Structured Query Language", "Standard Question Language", "Sequential Query Logic"], "answer": 1, "explanation": "SQL is the standard language for relational database management."},
            {"q": "What is version control?", "options": ["Software licensing", "Managing code changes over time", "Server configuration", "Testing methodology"], "answer": 1, "explanation": "Version control tracks changes to code, enabling collaboration and rollback."},
        ],
        "intermediate": [
            {"q": "What is the difference between authentication and authorization?", "options": ["They are the same", "Authentication verifies identity; authorization grants permissions", "Authorization verifies identity; authentication grants permissions", "Neither involves identity"], "answer": 1, "explanation": "Auth(n) = Who are you? Auth(z) = What can you do?"},
            {"q": "What is a RESTful API?", "options": ["An API using SOAP", "An API following REST architectural constraints", "A real-time streaming API", "An API with no authentication"], "answer": 1, "explanation": "REST APIs follow constraints: stateless, client-server, cacheable, uniform interface."},
            {"q": "What is the purpose of a load balancer?", "options": ["Compress data", "Distribute traffic across multiple servers", "Monitor server health only", "Cache responses"], "answer": 1, "explanation": "Load balancers distribute incoming requests to prevent server overload."},
        ],
        "advanced": [
            {"q": "What is eventual consistency in distributed systems?", "options": ["Data is always consistent", "All nodes will eventually have the same data", "Consistency is sacrificed permanently", "Only one node holds data"], "answer": 1, "explanation": "Eventual consistency means all nodes will converge to the same value given enough time."},
            {"q": "What is the two-phase commit protocol?", "options": ["A UI pattern", "A distributed transaction protocol", "A load balancing strategy", "A caching strategy"], "answer": 1, "explanation": "2PC ensures atomicity across distributed systems with a prepare and commit phase."},
        ]
    }
}

def get_assessment_questions(skill, level="intermediate", count=10):
    """Fetch MCQ questions for a skill and level."""
    skill_lower = skill.lower()
    
    # Find the best matching category
    bank = None
    for key in MCQ_BANK:
        if key in skill_lower or skill_lower in key:
            bank = MCQ_BANK[key]
            break
    
    if not bank:
        bank = MCQ_BANK["general"]
    
    # Get questions from the level
    questions = []
    if level in bank:
        questions = bank[level].copy()
    
    # If not enough, add from adjacent levels
    if len(questions) < count:
        for lvl in ["beginner", "intermediate", "advanced"]:
            if lvl != level and lvl in bank:
                questions.extend(bank[lvl])
    
    random.shuffle(questions)
    result = []
    for i, q in enumerate(questions[:count]):
        result.append({
            "id": i + 1,
            "question": q["q"],
            "options": q["options"],
            "answer": q["answer"],
            "explanation": q["explanation"],
            "level": level
        })
    
    return result

def evaluate_mcq_answers(questions, user_answers):
    """Evaluate MCQ answers and return detailed results."""
    results = []
    correct = 0
    
    for i, q in enumerate(questions):
        user_ans = user_answers.get(str(q["id"]), -1)
        is_correct = (user_ans == q["answer"])
        if is_correct:
            correct += 1
        
        results.append({
            "id": q["id"],
            "question": q["question"],
            "user_answer": user_ans,
            "correct_answer": q["answer"],
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
            "options": q["options"]
        })
    
    total = len(questions)
    score_pct = round((correct / total) * 100) if total > 0 else 0
    
    return {
        "results": results,
        "correct": correct,
        "total": total,
        "score_percentage": score_pct,
        "grade": get_grade(score_pct),
        "feedback": get_mcq_feedback(score_pct, correct, total)
    }

def get_grade(score):
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"

def get_mcq_feedback(score, correct, total):
    if score >= 80:
        return f"Outstanding! You answered {correct}/{total} correctly. You have strong knowledge in this area."
    elif score >= 60:
        return f"Good performance! {correct}/{total} correct. Review the questions you missed to strengthen your knowledge."
    elif score >= 40:
        return f"Needs improvement. {correct}/{total} correct. Focus on the fundamentals and practice more."
    else:
        return f"Keep practicing! {correct}/{total} correct. Consider revisiting core concepts before retaking."
