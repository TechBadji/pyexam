"""Peuplement de la banque de questions Python.

Usage : docker compose exec backend python seed_bank.py

30 débutant · 60 intermédiaire · 30 expert
"""

import asyncio

from sqlalchemy import func, select

from app.database import AsyncSessionLocal
from app.models.question import QuestionType
from app.models.question_bank import BankMCQOption, BankQuestion, DifficultyLevel
from app.models.user import User

# ── helpers ───────────────────────────────────────────────────────────────────

def mcq(difficulty, tags, statement, options, points=1.0):
    correct = [o for o in options if o[2]]
    assert len(correct) == 1, f"Exactly one correct answer required: {statement[:60]}"
    return {
        "type": QuestionType.mcq,
        "difficulty": difficulty,
        "tags": tags,
        "statement": statement,
        "points": points,
        "options": [{"label": l, "text": t, "is_correct": c} for l, t, c in options],
    }


def coding(difficulty, tags, statement, test_cases, points=2.0):
    return {
        "type": QuestionType.coding,
        "difficulty": difficulty,
        "tags": tags,
        "statement": statement,
        "points": points,
        "test_cases": test_cases,
    }


B = DifficultyLevel.beginner
I = DifficultyLevel.intermediate
E = DifficultyLevel.expert

# ── QUESTIONS ─────────────────────────────────────────────────────────────────

QUESTIONS = [

    # ════════════════════════════════════════════════════════════════════════
    # DÉBUTANT  (30 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["types", "bases"], "Quel est le type de la valeur `42` en Python ?", [
        ("A", "str", False), ("B", "int", True), ("C", "float", False), ("D", "bool", False),
    ]),

    mcq(B, ["opérateurs", "bases"], "Que vaut `10 % 3` ?", [
        ("A", "3", False), ("B", "0", False), ("C", "1", True), ("D", "3.33", False),
    ]),

    mcq(B, ["chaînes", "méthodes"], "Que retourne `\"hello\".upper()` ?", [
        ("A", "hello", False), ("B", "HELLO", True), ("C", "Hello", False), ("D", "hELLO", False),
    ]),

    mcq(B, ["listes", "fonctions-builtin"], "Que retourne `len([1, 2, 3, 4])` ?", [
        ("A", "3", False), ("B", "4", True), ("C", "5", False), ("D", "None", False),
    ]),

    mcq(B, ["booléens", "bases"], "Que vaut `bool(0)` ?", [
        ("A", "True", False), ("B", "0", False), ("C", "None", False), ("D", "False", True),
    ]),

    mcq(B, ["types", "none"], "Quel est le type de `None` ?", [
        ("A", "null", False), ("B", "NoneType", True), ("C", "void", False), ("D", "undefined", False),
    ]),

    mcq(B, ["listes", "indexation"], "Que retourne `[-1, -2, -3][-1]` ?", [
        ("A", "-1", False), ("B", "-2", False), ("C", "-3", True), ("D", "IndexError", False),
    ]),

    mcq(B, ["range", "boucles"], "Combien d'éléments contient `list(range(5))` ?", [
        ("A", "4", False), ("B", "5", True), ("C", "6", False), ("D", "0", False),
    ]),

    mcq(B, ["opérateurs", "puissance"], "Que vaut `2 ** 10` ?", [
        ("A", "20", False), ("B", "512", False), ("C", "1024", True), ("D", "2048", False),
    ]),

    mcq(B, ["conversion", "exceptions"], "Que se passe-t-il si on exécute `int(\"3.14\")` ?", [
        ("A", "Retourne 3", False), ("B", "Retourne 3.14", False),
        ("C", "Lève une ValueError", True), ("D", "Retourne None", False),
    ]),

    mcq(B, ["boucles", "contrôle"], "Quel mot-clé permet de sortir immédiatement d'une boucle ?", [
        ("A", "exit", False), ("B", "return", False), ("C", "break", True), ("D", "stop", False),
    ]),

    mcq(B, ["chaînes", "slicing"], "Que retourne `\"python\"[2:5]` ?", [
        ("A", "pyt", False), ("B", "yth", False), ("C", "tho", True), ("D", "hon", False),
    ]),

    mcq(B, ["bases", "opérateurs"], "Quelle est la différence entre `=` et `==` en Python ?", [
        ("A", "Aucune différence", False),
        ("B", "`=` affecte une valeur, `==` compare deux valeurs", True),
        ("C", "`==` affecte une valeur, `=` compare deux valeurs", False),
        ("D", "`=` est utilisé dans les conditions", False),
    ]),

    mcq(B, ["structures", "immuable"], "Laquelle de ces structures est **immuable** ?", [
        ("A", "list", False), ("B", "dict", False), ("C", "set", False), ("D", "tuple", True),
    ]),

    mcq(B, ["listes", "méthodes"], "Quelle méthode ajoute un élément à la fin d'une liste ?", [
        ("A", "add()", False), ("B", "insert()", False), ("C", "push()", False), ("D", "append()", True),
    ]),

    mcq(B, ["chaînes", "méthodes"], "Que retourne `\"  bonjour  \".strip()` ?", [
        ("A", "\"  bonjour  \"", False), ("B", "\"bonjour\"", True),
        ("C", "\"bonjour  \"", False), ("D", "\"  bonjour\"", False),
    ]),

    mcq(B, ["opérateurs", "division"], "Que vaut `7 // 2` ?", [
        ("A", "3.5", False), ("B", "4", False), ("C", "3", True), ("D", "2", False),
    ]),

    mcq(B, ["fonctions", "syntaxe"], "Quel mot-clé définit une fonction en Python ?", [
        ("A", "func", False), ("B", "function", False), ("C", "define", False), ("D", "def", True),
    ]),

    mcq(B, ["chaînes", "f-string"], "Parmi ces syntaxes, laquelle est un **f-string** valide ?", [
        ("A", "f'Bonjour, {nom}'", True), ("B", "'Bonjour, {nom}'", False),
        ("C", "\"Bonjour, \" + {nom}", False), ("D", "%Bonjour, nom%", False),
    ]),

    mcq(B, ["listes", "opérations"], "Que vaut `[1, 2] + [3, 4]` ?", [
        ("A", "[4, 6]", False), ("B", "7", False), ("C", "[1, 2, 3, 4]", True), ("D", "Erreur", False),
    ]),

    coding(B, ["arithmétique", "entrée-sortie"],
        "Lisez deux entiers sur deux lignes et affichez leur somme.",
        [
            {"input": "3\n7", "expected_output": "10", "weight": 1},
            {"input": "0\n0", "expected_output": "0", "weight": 1},
            {"input": "-5\n5", "expected_output": "0", "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["boucles", "conditions"],
        ("FizzBuzz : lisez un entier N et affichez les nombres de 1 à N,\n"
         "en remplaçant les multiples de 3 par 'Fizz', les multiples de 5 par 'Buzz',\n"
         "et les multiples des deux par 'FizzBuzz'. Un nombre par ligne."),
        [
            {"input": "5", "expected_output": "1\n2\nFizz\n4\nBuzz", "weight": 1},
            {"input": "15", "expected_output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", "weight": 2},
        ], points=2,
    ),

    coding(B, ["conditions", "arithmétique"],
        "Lisez un entier N et affichez 'pair' s'il est pair, 'impair' sinon.",
        [
            {"input": "4", "expected_output": "pair", "weight": 1},
            {"input": "7", "expected_output": "impair", "weight": 1},
            {"input": "0", "expected_output": "pair", "weight": 1},
        ], points=1,
    ),

    coding(B, ["chaînes", "slicing"],
        "Lisez une chaîne de caractères et affichez-la à l'envers.",
        [
            {"input": "python", "expected_output": "nohtyp", "weight": 1},
            {"input": "abcde", "expected_output": "edcba", "weight": 1},
            {"input": "a", "expected_output": "a", "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["récursion", "arithmétique"],
        "Lisez un entier N (0 ≤ N ≤ 12) et affichez la factorielle de N.",
        [
            {"input": "0", "expected_output": "1", "weight": 1},
            {"input": "5", "expected_output": "120", "weight": 1},
            {"input": "10", "expected_output": "3628800", "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["listes", "fonctions-builtin"],
        "Lisez d'abord N, puis N entiers (un par ligne) et affichez le maximum.",
        [
            {"input": "4\n3\n1\n7\n2", "expected_output": "7", "weight": 1},
            {"input": "1\n-5", "expected_output": "-5", "weight": 1},
            {"input": "3\n10\n10\n10", "expected_output": "10", "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["chaînes", "boucles"],
        "Lisez une chaîne et affichez le nombre de voyelles (a, e, i, o, u, y — minuscules et majuscules).",
        [
            {"input": "Bonjour", "expected_output": "3", "weight": 1},
            {"input": "Python", "expected_output": "2", "weight": 1},
            {"input": "xyz", "expected_output": "1", "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["arithmétique", "conversion"],
        "Lisez une température en Celsius (nombre flottant) et affichez l'équivalent en Fahrenheit,\narrondi à 1 décimale. Formule : F = C * 9/5 + 32.",
        [
            {"input": "0", "expected_output": "32.0", "weight": 1},
            {"input": "100", "expected_output": "212.0", "weight": 1},
            {"input": "37", "expected_output": "98.6", "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["chaînes", "palindrome"],
        "Lisez une chaîne et affichez True si elle est un palindrome, False sinon.\n(Insensible à la casse, ignorer les espaces.)",
        [
            {"input": "racecar", "expected_output": "True", "weight": 1},
            {"input": "hello", "expected_output": "False", "weight": 1},
            {"input": "A man a plan a canal Panama", "expected_output": "True", "weight": 2},
        ], points=2,
    ),

    coding(B, ["boucles", "suite"],
        "Lisez N et affichez les N premiers termes de la suite de Fibonacci séparés par des espaces.\n(0 1 1 2 3 5 …)",
        [
            {"input": "1", "expected_output": "0", "weight": 1},
            {"input": "5", "expected_output": "0 1 1 2 3", "weight": 1},
            {"input": "8", "expected_output": "0 1 1 2 3 5 8 13", "weight": 1},
        ], points=2,
    ),

    # ════════════════════════════════════════════════════════════════════════
    # INTERMÉDIAIRE  (60 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(I, ["compréhensions", "listes"], "Que retourne `[x**2 for x in range(4)]` ?", [
        ("A", "[0, 1, 4, 9]", True), ("B", "[1, 4, 9, 16]", False),
        ("C", "[0, 1, 2, 3]", False), ("D", "[1, 2, 3, 4]", False),
    ]),

    mcq(I, ["dictionnaires", "méthodes"], "Que retourne `{'a': 1}.get('b', 42)` ?", [
        ("A", "None", False), ("B", "KeyError", False), ("C", "42", True), ("D", "0", False),
    ]),

    mcq(I, ["fonctions", "*args"], "Que vaut `sum_all(1, 2, 3)` si défini comme `def sum_all(*args): return sum(args)` ?", [
        ("A", "TypeError", False), ("B", "(1,2,3)", False), ("C", "6", True), ("D", "[1,2,3]", False),
    ]),

    mcq(I, ["fonctions", "lambda"], "Quelle est la valeur de `(lambda x, y: x * y)(3, 4)` ?", [
        ("A", "7", False), ("B", "12", True), ("C", "34", False), ("D", "TypeError", False),
    ]),

    mcq(I, ["fonctions-builtin", "map"], "Que retourne `list(map(str, [1, 2, 3]))` ?", [
        ("A", "[1, 2, 3]", False), ("B", "['1', '2', '3']", True), ("C", "[str, str, str]", False), ("D", "TypeError", False),
    ]),

    mcq(I, ["fonctions-builtin", "filter"], "Que retourne `list(filter(lambda x: x > 0, [-1, 2, -3, 4]))` ?", [
        ("A", "[-1, -3]", False), ("B", "[2, 4]", True), ("C", "[True, False, True, False]", False), ("D", "[-1, 2, -3, 4]", False),
    ]),

    mcq(I, ["tri", "sorted"], "Que retourne `sorted([3, 1, 4, 1, 5], reverse=True)` ?", [
        ("A", "[1, 1, 3, 4, 5]", False), ("B", "[5, 4, 3, 1, 1]", True), ("C", "[5, 4, 3, 2, 1]", False), ("D", "[3, 1, 4, 1, 5]", False),
    ]),

    mcq(I, ["fonctions-builtin", "enumerate"], "Que retourne `list(enumerate(['a', 'b', 'c']))` ?", [
        ("A", "[0, 1, 2]", False), ("B", "['a', 'b', 'c']", False),
        ("C", "[(0,'a'), (1,'b'), (2,'c')]", True), ("D", "[('a',0), ('b',1), ('c',2)]", False),
    ]),

    mcq(I, ["fonctions-builtin", "zip"], "Que retourne `list(zip([1,2,3], ['a','b','c']))` ?", [
        ("A", "[(1,2,3),('a','b','c')]", False), ("B", "[(1,'a'),(2,'b'),(3,'c')]", True),
        ("C", "[1,'a',2,'b',3,'c']", False), ("D", "TypeError", False),
    ]),

    mcq(I, ["exceptions"], "Quelle exception est levée par `1 / 0` ?", [
        ("A", "ValueError", False), ("B", "ArithmeticError", False),
        ("C", "ZeroDivisionError", True), ("D", "RuntimeError", False),
    ]),

    mcq(I, ["OOP", "classes"], "Comment crée-t-on une instance de `class Voiture: pass` ?", [
        ("A", "Voiture.new()", False), ("B", "new Voiture()", False), ("C", "Voiture()", True), ("D", "create(Voiture)", False),
    ]),

    mcq(I, ["OOP", "__init__"], "Quel est le rôle de la méthode `__init__` dans une classe Python ?", [
        ("A", "Détruire l'instance", False),
        ("B", "Initialiser les attributs de l'instance lors de sa création", True),
        ("C", "Définir les méthodes de classe", False),
        ("D", "Copier l'instance", False),
    ]),

    mcq(I, ["OOP", "héritage"], "À quoi sert `super().__init__(...)` dans une sous-classe ?", [
        ("A", "Crée une nouvelle classe parente", False),
        ("B", "Appelle le constructeur de la classe parente", True),
        ("C", "Supprime l'héritage", False),
        ("D", "Accède aux attributs privés", False),
    ]),

    mcq(I, ["OOP", "décorateurs"], "Que caractérise `@staticmethod` sur une méthode de classe ?", [
        ("A", "Elle reçoit `self` en premier paramètre", False),
        ("B", "Elle reçoit `cls` en premier paramètre", False),
        ("C", "Elle ne reçoit ni `self` ni `cls`", True),
        ("D", "Elle est privée", False),
    ]),

    mcq(I, ["OOP", "décorateurs"], "Quel est le premier paramètre d'une `@classmethod` ?", [
        ("A", "self", False), ("B", "cls", True), ("C", "class_", False), ("D", "Aucun", False),
    ]),

    mcq(I, ["OOP", "property"], "Que fait le décorateur `@property` sur une méthode ?", [
        ("A", "La rend statique", False),
        ("B", "Permet d'y accéder comme un attribut (sans parenthèses)", True),
        ("C", "La rend privée", False),
        ("D", "L'exécute au démarrage", False),
    ]),

    mcq(I, ["décorateurs"], "Un décorateur Python est fondamentalement…", [
        ("A", "Un opérateur binaire", False),
        ("B", "Une fonction qui prend une fonction en argument et retourne une fonction", True),
        ("C", "Un mot-clé réservé", False),
        ("D", "Un module standard", False),
    ]),

    mcq(I, ["générateurs", "yield"], "Quelle est la différence entre `return` et `yield` dans une fonction ?", [
        ("A", "Aucune", False),
        ("B", "`yield` produit une valeur et suspend la fonction, créant un générateur", True),
        ("C", "`yield` retourne un tuple", False),
        ("D", "`yield` ne peut pas être utilisé dans une boucle", False),
    ]),

    mcq(I, ["context-manager", "fichiers"], "Quel est l'avantage de `with open('f.txt') as f:` ?", [
        ("A", "Lecture plus rapide", False),
        ("B", "Fermeture automatique du fichier même en cas d'exception", True),
        ("C", "Chargement en mémoire complet", False),
        ("D", "Accès en lecture seule", False),
    ]),

    mcq(I, ["OOP", "isinstance"], "Que retourne `isinstance(True, int)` en Python ?", [
        ("A", "False — bool n'est pas int", False),
        ("B", "True — bool hérite de int", True),
        ("C", "TypeError", False),
        ("D", "None", False),
    ]),

    mcq(I, ["fonctions", "pièges"], "Quel est le piège classique des **arguments par défaut mutables** ?", [
        ("A", "Ils sont plus lents", False),
        ("B", "Ils sont partagés entre tous les appels de la fonction", True),
        ("C", "Ils ne peuvent pas être modifiés", False),
        ("D", "Ils lèvent une TypeError", False),
    ]),

    mcq(I, ["fonctions", "closures"],
        "Qu'est-ce qu'une **closure** en Python ?", [
        ("A", "Une fonction récursive", False),
        ("B", "Une fonction qui capture des variables de sa portée englobante", True),
        ("C", "Une méthode de classe fermée (privée)", False),
        ("D", "Un générateur fermé", False),
    ]),

    mcq(I, ["fonctions-builtin", "any"], "Que retourne `any([False, False, True, False])` ?", [
        ("A", "False", False), ("B", "True", True), ("C", "[True]", False), ("D", "1", False),
    ]),

    mcq(I, ["ensembles", "opérations"], "Que vaut `{1, 2, 3} & {2, 3, 4}` ?", [
        ("A", "{1, 2, 3, 4}", False), ("B", "{2, 3}", True), ("C", "{1, 4}", False), ("D", "{1, 2, 3, 2, 3, 4}", False),
    ]),

    mcq(I, ["compréhensions", "dict"], "Quelle est la syntaxe d'une **dict comprehension** pour inverser `{1:'a', 2:'b'}` ?", [
        ("A", "[v: k for k, v in d.items()]", False),
        ("B", "{v: k for k, v in d.items()}", True),
        ("C", "{k: v for v, k in d}", False),
        ("D", "dict(v: k for k, v in d)", False),
    ]),

    mcq(I, ["déballage", "**kwargs"], "Que permet `**kwargs` dans la signature d'une fonction ?", [
        ("A", "Passer des arguments positionnels supplémentaires", False),
        ("B", "Passer un nombre variable d'arguments nommés sous forme de dict", True),
        ("C", "Déclarer des arguments obligatoires", False),
        ("D", "Retourner plusieurs valeurs", False),
    ]),

    mcq(I, ["collections", "Counter"],
        "Que retourne `Counter('abracadabra')['a']` (de `collections.Counter`) ?", [
        ("A", "1", False), ("B", "3", False), ("C", "5", True), ("D", "7", False),
    ]),

    mcq(I, ["collections", "defaultdict"],
        "Que vaut `d['x']` après `from collections import defaultdict; d = defaultdict(int)` sans que 'x' ait été assigné ?", [
        ("A", "None", False), ("B", "KeyError", False), ("C", "0", True), ("D", "[]", False),
    ]),

    mcq(I, ["expressions-régulières"], "Que retourne `re.findall(r'\\d+', 'abc123def456')` ?", [
        ("A", "['123456']", False), ("B", "['123', '456']", True), ("C", "[123, 456]", False), ("D", "['1','2','3','4','5','6']", False),
    ]),

    mcq(I, ["json"], "Que retourne `json.dumps({'nom': 'Alice', 'age': 30})` ?", [
        ("A", "{'nom': 'Alice', 'age': 30}", False),
        ("B", "'{\"nom\": \"Alice\", \"age\": 30}'", True),
        ("C", "[nom, Alice, age, 30]", False),
        ("D", "TypeError", False),
    ]),

    mcq(I, ["exceptions", "try-else"],
        "Dans un bloc `try/except/else`, quand le bloc `else` est-il exécuté ?", [
        ("A", "Toujours", False),
        ("B", "Seulement si une exception est levée", False),
        ("C", "Seulement si aucune exception n'est levée", True),
        ("D", "Jamais — `else` n'existe pas avec try", False),
    ]),

    mcq(I, ["walrus", "Python3.8+"],
        "Quel est le rôle de l'opérateur `:=` (walrus) introduit en Python 3.8 ?", [
        ("A", "Comparaison d'identité", False),
        ("B", "Assignation ET évaluation dans une expression", True),
        ("C", "Division entière", False),
        ("D", "Déballage de tuple", False),
    ]),

    mcq(I, ["OOP", "MRO"],
        "Que signifie MRO en Python, et à quoi sert-il ?", [
        ("A", "Memory Reference Order — gestion de la mémoire", False),
        ("B", "Method Resolution Order — ordre de recherche des méthodes en héritage multiple", True),
        ("C", "Module Registry Object — registre des modules", False),
        ("D", "Mutable Relational Object — objets mutables", False),
    ]),

    mcq(I, ["OOP", "__repr__"],
        "Quelle est la différence principale entre `__str__` et `__repr__` ?", [
        ("A", "Aucune différence", False),
        ("B", "`__str__` est pour l'affichage utilisateur, `__repr__` pour le débogage/développeur", True),
        ("C", "`__repr__` est plus rapide", False),
        ("D", "`__str__` est appelé par `print()` seulement dans les tests", False),
    ]),

    mcq(I, ["copie", "objets"],
        "Quelle est la différence entre `copy.copy()` (shallow) et `copy.deepcopy()` ?", [
        ("A", "Aucune pour les types primitifs", False),
        ("B", "La copie superficielle duplique le conteneur mais pas les objets imbriqués", True),
        ("C", "La copie profonde est plus lente mais identique en résultat", False),
        ("D", "`deepcopy` ne fonctionne pas sur les listes", False),
    ]),

    mcq(I, ["portée", "global"],
        "Que fait le mot-clé `global x` à l'intérieur d'une fonction ?", [
        ("A", "Crée une nouvelle variable locale `x`", False),
        ("B", "Permet de lire ET modifier la variable `x` du module global", True),
        ("C", "Rend `x` accessible en dehors du module", False),
        ("D", "Identique à `x = None`", False),
    ]),

    mcq(I, ["générateurs", "performance"],
        "Quelle est la principale différence entre `[x for x in range(1000000)]` et `(x for x in range(1000000))` ?", [
        ("A", "Syntaxe uniquement, résultat identique", False),
        ("B", "La liste alloue tout en mémoire, le générateur est évalué paresseusement", True),
        ("C", "Le générateur est plus rapide à créer et identique en mémoire", False),
        ("D", "La liste supporte l'indexation, le générateur non — mais consommation mémoire identique", False),
    ]),

    mcq(I, ["fonctions-builtin", "reduce"],
        "Que retourne `functools.reduce(lambda acc, x: acc + x, [1, 2, 3, 4])` ?", [
        ("A", "[1, 3, 6, 10]", False), ("B", "10", True), ("C", "(1,2,3,4)", False), ("D", "TypeError", False),
    ]),

    mcq(I, ["structures", "sets"],
        "Parmi les affirmations suivantes, laquelle est vraie pour les `set` Python ?", [
        ("A", "Les éléments sont ordonnés et indexables", False),
        ("B", "Les éléments sont uniques et non ordonnés", True),
        ("C", "Ils acceptent des éléments dupliqués", False),
        ("D", "On peut y accéder par clé", False),
    ]),

    mcq(I, ["chaînes", "méthodes"],
        "Que retourne `'a,b,c,d'.split(',', 2)` ?", [
        ("A", "['a', 'b', 'c', 'd']", False), ("B", "['a', 'b', 'c,d']", True),
        ("C", "['a,b', 'c,d']", False), ("D", "['a', 'b']", False),
    ]),

    mcq(I, ["décorateurs", "functools"],
        "Que fait `@functools.wraps(func)` dans un décorateur ?", [
        ("A", "Améliore les performances de la fonction décorée", False),
        ("B", "Préserve le nom et la docstring de la fonction originale", True),
        ("C", "Rend la fonction thread-safe", False),
        ("D", "Crée une copie de la fonction", False),
    ]),

    # Coding intermédiaire (20)

    coding(I, ["suites", "itératif"],
        "Lisez N et affichez le Nième terme de Fibonacci (0-indexé) de manière **itérative**.\n(F(0)=0, F(1)=1, F(2)=1, F(3)=2…)",
        [
            {"input": "0", "expected_output": "0", "weight": 1},
            {"input": "10", "expected_output": "55", "weight": 1},
            {"input": "20", "expected_output": "6765", "weight": 1},
        ], points=2,
    ),

    coding(I, ["algorithmes", "recherche"],
        ("Recherche binaire : lisez d'abord N, puis N entiers triés (un par ligne), "
         "puis la valeur cible. Affichez l'indice (0-indexé) ou -1 si absent."),
        [
            {"input": "5\n1\n3\n5\n7\n9\n5", "expected_output": "2", "weight": 1},
            {"input": "4\n2\n4\n6\n8\n1", "expected_output": "-1", "weight": 1},
            {"input": "1\n42\n42", "expected_output": "0", "weight": 1},
        ], points=3,
    ),

    coding(I, ["chaînes", "anagramme"],
        "Lisez deux chaînes sur deux lignes et affichez True si elles sont des anagrammes, False sinon.\n(Insensible à la casse, ignorer les espaces.)",
        [
            {"input": "listen\nsilent", "expected_output": "True", "weight": 1},
            {"input": "hello\nworld", "expected_output": "False", "weight": 1},
            {"input": "Astronomer\nMoon starer", "expected_output": "True", "weight": 2},
        ], points=2,
    ),

    coding(I, ["listes", "récursion"],
        "Aplatissement : lisez une liste Python littérale (ex: [[1,[2,3]],[4]]) et affichez tous les éléments séparés par des espaces dans l'ordre de parcours.",
        [
            {"input": "[[1,2],[3,[4,5]]]", "expected_output": "1 2 3 4 5", "weight": 1},
            {"input": "[1,[2,[3,[4]]]]", "expected_output": "1 2 3 4", "weight": 1},
            {"input": "[42]", "expected_output": "42", "weight": 1},
        ], points=3,
    ),

    coding(I, ["dictionnaires", "chaînes"],
        ("Lisez une phrase et affichez chaque mot unique suivi de son nombre d'occurrences,\n"
         "triés par ordre alphabétique. Format : 'mot: N' (un par ligne)."),
        [
            {"input": "le chat et le chien", "expected_output": "chien: 1\nchat: 1\net: 1\nle: 2", "weight": 1},
            {"input": "a a a b b c", "expected_output": "a: 3\nb: 2\nc: 1", "weight": 1},
        ], points=3,
    ),

    coding(I, ["dictionnaires", "inversion"],
        "Lisez N paires 'clé valeur' (une par ligne) et affichez le dictionnaire inversé (valeurs→clés),\ntriés par clé originale. Format : 'valeur: clé' (un par ligne).",
        [
            {"input": "2\na 1\nb 2", "expected_output": "1: a\n2: b", "weight": 1},
            {"input": "3\nx alpha\ny beta\nz gamma", "expected_output": "alpha: x\nbeta: y\ngamma: z", "weight": 1},
        ], points=2,
    ),

    coding(I, ["listes", "ensembles"],
        "Lisez N entiers (un par ligne), supprimez les doublons en **préservant l'ordre d'apparition**,\npuis affichez les valeurs restantes séparées par des espaces.",
        [
            {"input": "6\n3\n1\n4\n1\n5\n3", "expected_output": "3 1 4 5", "weight": 1},
            {"input": "3\n7\n7\n7", "expected_output": "7", "weight": 1},
            {"input": "4\n1\n2\n3\n4", "expected_output": "1 2 3 4", "weight": 1},
        ], points=2,
    ),

    coding(I, ["algorithmes", "fusion"],
        ("Fusion de listes triées : lisez d'abord N puis N entiers (liste A), "
         "puis M puis M entiers (liste B). Affichez la liste fusionnée triée, séparée par des espaces."),
        [
            {"input": "3\n1\n3\n5\n3\n2\n4\n6", "expected_output": "1 2 3 4 5 6", "weight": 1},
            {"input": "2\n1\n1\n2\n1\n2", "expected_output": "1 1 1 2", "weight": 1},
            {"input": "0\n3\n7\n8\n9", "expected_output": "7 8 9", "weight": 1},
        ], points=3,
    ),

    coding(I, ["piles", "parenthèses"],
        "Lisez une chaîne et affichez True si les parenthèses/crochets/accolades sont équilibrés, False sinon.",
        [
            {"input": "({[]})", "expected_output": "True", "weight": 1},
            {"input": "([)]", "expected_output": "False", "weight": 1},
            {"input": "{[]}", "expected_output": "True", "weight": 1},
            {"input": "(((", "expected_output": "False", "weight": 1},
        ], points=3,
    ),

    coding(I, ["chaînes", "chiffrement"],
        "Chiffrement César : lisez sur deux lignes la chaîne à chiffrer et le décalage K (entier).\nChiffrez uniquement les lettres (majuscules conservées), affichez le résultat.",
        [
            {"input": "hello\n3", "expected_output": "khoor", "weight": 1},
            {"input": "Python\n1", "expected_output": "Qzuipo", "weight": 2},
            {"input": "xyz\n3", "expected_output": "abc", "weight": 1},
        ], points=3,
    ),

    coding(I, ["algorithmes", "tableaux"],
        ("Two Sum : lisez N, puis N entiers (un par ligne), puis la cible.\n"
         "Affichez les deux indices (i j, i<j) dont la somme vaut la cible, ou -1 si impossible.\n"
         "Retournez la première paire trouvée en parcourant de gauche à droite."),
        [
            {"input": "4\n2\n7\n11\n15\n9", "expected_output": "0 1", "weight": 1},
            {"input": "4\n3\n2\n4\n1\n6", "expected_output": "1 2", "weight": 1},
            {"input": "3\n1\n2\n3\n10", "expected_output": "-1", "weight": 1},
        ], points=3,
    ),

    coding(I, ["matrices", "transposition"],
        ("Lisez N puis M, puis N lignes de M entiers séparés par des espaces.\n"
         "Affichez la matrice transposée (M lignes de N entiers, séparés par des espaces)."),
        [
            {"input": "2\n3\n1 2 3\n4 5 6", "expected_output": "1 4\n2 5\n3 6", "weight": 1},
            {"input": "3\n3\n1 2 3\n4 5 6\n7 8 9", "expected_output": "1 4 7\n2 5 8\n3 6 9", "weight": 2},
        ], points=3,
    ),

    coding(I, ["chaînes", "algorithmes"],
        ("Lisez N chaînes (une par ligne) et affichez leur plus long préfixe commun.\n"
         "Si aucun préfixe commun n'existe, affichez une chaîne vide."),
        [
            {"input": "3\nflower\nflow\nflight", "expected_output": "fl", "weight": 1},
            {"input": "3\ndog\ncar\nrace", "expected_output": "", "weight": 1},
            {"input": "2\npython\npython", "expected_output": "python", "weight": 1},
        ], points=2,
    ),

    coding(I, ["arithmétique", "nombres-premiers"],
        "Lisez N entiers (un par ligne) et affichez 'premier' ou 'compose' pour chacun.",
        [
            {"input": "3\n2\n9\n17", "expected_output": "premier\ncompose\npremier", "weight": 1},
            {"input": "2\n1\n13", "expected_output": "compose\npremier", "weight": 1},
        ], points=2,
    ),

    coding(I, ["arithmétique", "bases-numériques"],
        "Lisez un entier positif N et affichez sa représentation binaire sans le préfixe '0b'.\n(Sans utiliser `bin()`)",
        [
            {"input": "10", "expected_output": "1010", "weight": 1},
            {"input": "1", "expected_output": "1", "weight": 1},
            {"input": "255", "expected_output": "11111111", "weight": 1},
        ], points=2,
    ),

    coding(I, ["chaînes", "RLE"],
        ("Décodage RLE : lisez une chaîne encodée (ex: '3a2b1c') et affichez la chaîne décodée.\n"
         "Format : suite de (nombre)(lettre)."),
        [
            {"input": "3a2b1c", "expected_output": "aaabbc", "weight": 1},
            {"input": "4x1y3z", "expected_output": "xxxxyzzz", "weight": 1},
            {"input": "1p1y1t1h1o1n", "expected_output": "python", "weight": 1},
        ], points=2,
    ),

    coding(I, ["dictionnaires", "tri"],
        ("Lisez N paires 'mot score' (une par ligne) puis affichez les mots triés par score décroissant,\n"
         "puis alphabétiquement en cas d'égalité. Format : 'mot: score' (un par ligne)."),
        [
            {"input": "3\nalice 90\nbob 85\nclaude 90", "expected_output": "alice: 90\nclaude: 90\nbob: 85", "weight": 1},
            {"input": "2\nx 10\ny 20", "expected_output": "y: 20\nx: 10", "weight": 1},
        ], points=3,
    ),

    coding(I, ["piles", "structures"],
        ("Implémentez une pile avec `push n` (empile), `pop` (dépile et affiche, ou 'vide'),\n"
         "`peek` (affiche le sommet, ou 'vide'). Lisez N opérations (une par ligne)."),
        [
            {"input": "5\npush 1\npush 2\npeek\npop\npop", "expected_output": "2\n2\n1", "weight": 1},
            {"input": "2\npop\npush 5", "expected_output": "vide", "weight": 1},
        ], points=3,
    ),

    coding(I, ["récursion", "arithmétique"],
        "Lisez deux entiers B et N et calculez B**N par **récursion** (sans utiliser `**` ni `pow()`).",
        [
            {"input": "2\n10", "expected_output": "1024", "weight": 1},
            {"input": "3\n0", "expected_output": "1", "weight": 1},
            {"input": "7\n3", "expected_output": "343", "weight": 1},
        ], points=2,
    ),

    coding(I, ["listes", "algorithmes"],
        ("Lisez N entiers (un par ligne) et K.\n"
         "Affichez le Kème plus grand élément (1-indexé, K=1 est le maximum)."),
        [
            {"input": "5\n3 1 4 1 5\n2", "expected_output": "4", "weight": 1},
            {"input": "3\n7 7 7\n1", "expected_output": "7", "weight": 1},
            {"input": "4\n10 20 30 40\n4", "expected_output": "10", "weight": 1},
        ], points=3,
    ),

    # ════════════════════════════════════════════════════════════════════════
    # EXPERT  (30 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(E, ["métaclasses", "OOP-avancé"],
        "Qu'est-ce qu'une **métaclasse** en Python ?", [
        ("A", "Une classe abstraite ne pouvant pas être instanciée", False),
        ("B", "La classe d'une classe — elle contrôle la création et le comportement des classes", True),
        ("C", "Un design pattern spécifique à Python", False),
        ("D", "Une classe utilisant `__slots__`", False),
    ]),

    mcq(E, ["OOP-avancé", "création-instances"],
        "Quelle est la différence entre `__new__` et `__init__` ?", [
        ("A", "Aucune — ils font la même chose", False),
        ("B", "`__new__` crée l'instance (allocation), `__init__` l'initialise (attributs)", True),
        ("C", "`__init__` est appelé avant `__new__`", False),
        ("D", "`__new__` est réservé aux méthodes de classe", False),
    ]),

    mcq(E, ["descripteurs", "protocole"],
        "Un **descripteur** Python implémente au moins l'un de ces méthodes : `__get__`, `__set__`, `__delete__`.\nQu'est-ce qu'un **descripteur non-data** ?", [
        ("A", "Un descripteur sans `__get__`", False),
        ("B", "Un descripteur avec `__get__` mais sans `__set__` ni `__delete__`", True),
        ("C", "Un descripteur dont la donnée est None", False),
        ("D", "Un descripteur défini sur un type immuable", False),
    ]),

    mcq(E, ["OOP-avancé", "attributs"],
        "Quelle est la différence entre `__getattr__` et `__getattribute__` ?", [
        ("A", "Aucune différence", False),
        ("B", "`__getattribute__` est appelé pour **tout** accès d'attribut ; `__getattr__` seulement si l'attribut est introuvable", True),
        ("C", "`__getattr__` est plus rapide", False),
        ("D", "`__getattribute__` ne fonctionne que sur les méthodes", False),
    ]),

    mcq(E, ["async", "coroutines"],
        "Quel type d'objet retourne une fonction `async def` lorsqu'elle est appelée ?", [
        ("A", "Un Thread", False), ("B", "Un Future", False),
        ("C", "Une coroutine (objet coroutine)", True), ("D", "Un générateur", False),
    ]),

    mcq(E, ["async", "asyncio"],
        "Que fait `asyncio.gather(coro1, coro2, coro3)` ?", [
        ("A", "Exécute les coroutines séquentiellement", False),
        ("B", "Exécute les coroutines concurremment et attend qu'elles se terminent toutes", True),
        ("C", "Crée un pool de threads", False),
        ("D", "Annule les coroutines si l'une échoue", False),
    ]),

    mcq(E, ["concurrence", "GIL"],
        "Que signifie le GIL (*Global Interpreter Lock*) pour le multi-threading Python ?", [
        ("A", "Il n'a aucun impact sur les programmes Python", False),
        ("B", "Il empêche deux threads d'exécuter du bytecode Python **simultanément** dans un même processus", True),
        ("C", "Il est absent dans CPython depuis Python 3.10", False),
        ("D", "Il ne s'applique qu'aux I/O", False),
    ]),

    mcq(E, ["gestion-mémoire", "référencement"],
        "Quel mécanisme principal CPython utilise-t-il pour la gestion de la mémoire ?", [
        ("A", "Garbage collector generationnel uniquement", False),
        ("B", "Comptage de références + collecteur de cycles", True),
        ("C", "Arenas de mémoire uniquement", False),
        ("D", "Mark-and-sweep exclusivement", False),
    ]),

    mcq(E, ["OOP-avancé", "__slots__"],
        "Quel est l'avantage principal de `__slots__` dans une classe ?", [
        ("A", "Accès aux attributs plus lisible", False),
        ("B", "Réduction de la consommation mémoire (pas de `__dict__` par instance)", True),
        ("C", "Héritage automatique de toutes les méthodes", False),
        ("D", "Thread-safety automatique", False),
    ]),

    mcq(E, ["gestion-mémoire", "weakref"],
        "À quoi sert `weakref.ref(obj)` ?", [
        ("A", "Crée une copie immuable de l'objet", False),
        ("B", "Référence l'objet sans augmenter le compteur de références (ne l'empêche pas d'être collecté)", True),
        ("C", "Protège l'objet de la modification", False),
        ("D", "Permet l'accès thread-safe à l'objet", False),
    ]),

    mcq(E, ["générateurs", "coroutines"],
        "Quelle est la différence entre un **générateur** et une **coroutine** en Python moderne ?", [
        ("A", "Aucune — ce sont des synonymes", False),
        ("B", "Un générateur *produit* des valeurs avec `yield`; une coroutine *consomme* et produit avec `async/await`", True),
        ("C", "Les coroutines ne peuvent pas utiliser `yield`", False),
        ("D", "Les générateurs sont plus performants dans tous les cas", False),
    ]),

    mcq(E, ["optimisation", "cache"],
        "Que fait `@functools.lru_cache(maxsize=128)` sur une fonction ?", [
        ("A", "Met la fonction en file d'attente", False),
        ("B", "Mémoïse les résultats selon les arguments (Least Recently Used cache)", True),
        ("C", "Limite le nombre d'appels à 128 au total", False),
        ("D", "Parallélise automatiquement les appels", False),
    ]),

    mcq(E, ["itertools"], "Que produit `list(itertools.chain([1,2], [3,4], [5]))` ?", [
        ("A", "[[1,2],[3,4],[5]]", False), ("B", "[1,2,3,4,5]", True),
        ("C", "[(1,3,5),(2,4)]", False), ("D", "[1,2,3,4,5,5]", False),
    ]),

    mcq(E, ["fonctions", "partial"],
        "Que fait `functools.partial(pow, 2)` ?", [
        ("A", "Évalue `pow(2)` immédiatement", False),
        ("B", "Crée une nouvelle fonction `f(n)` équivalente à `pow(2, n)`", True),
        ("C", "Crée un décorateur pour `pow`", False),
        ("D", "Retourne `None`", False),
    ]),

    mcq(E, ["context-manager", "protocole"],
        "Quelles méthodes une classe doit-elle implémenter pour être utilisée avec `with` ?", [
        ("A", "`__open__` et `__close__`", False),
        ("B", "`__enter__` et `__exit__`", True),
        ("C", "`__start__` et `__stop__`", False),
        ("D", "`__init__` et `__del__`", False),
    ]),

    # Coding expert (15)

    coding(E, ["structures", "cache"],
        ("Implémentez un LRU Cache de capacité K.\n"
         "Lisez K, puis N opérations :\n"
         "  'get x' → afficher la valeur de x ou -1\n"
         "  'put x y' → insérer/mettre à jour x=y\n"
         "Quand la capacité est atteinte, évincer le moins récemment utilisé."),
        [
            {"input": "2\n7\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1", "expected_output": "1\n-1\n1", "weight": 3},
            {"input": "1\n3\nput 1 10\nget 1\nput 2 20", "expected_output": "10", "weight": 1},
        ], points=5,
    ),

    coding(E, ["mémoïsation", "décorateurs"],
        ("Fibonacci avec mémoïsation : implémentez un décorateur `memoize` et utilisez-le\n"
         "sur `fib(n)`. Lisez N et affichez fib(N). (N peut aller jusqu'à 50.)"),
        [
            {"input": "10", "expected_output": "55", "weight": 1},
            {"input": "30", "expected_output": "832040", "weight": 1},
            {"input": "50", "expected_output": "12586269025", "weight": 2},
        ], points=4,
    ),

    coding(E, ["context-manager", "OOP-avancé"],
        ("Implémentez un context manager `Timer` (classe) qui mesure le temps d'exécution.\n"
         "Pour ce problème simplifier : lisez N (millisecondes à simuler avec time.sleep),\n"
         "utilisez votre Timer, et affichez 'elapsed: X.Xs' avec 1 décimale (arrondi)."),
        [
            {"input": "0", "expected_output": "elapsed: 0.0s", "weight": 1},
        ], points=4,
    ),

    coding(E, ["générateurs", "nombres-premiers"],
        ("Créez un générateur infini de nombres premiers.\n"
         "Lisez N et affichez les N premiers nombres premiers séparés par des espaces."),
        [
            {"input": "5", "expected_output": "2 3 5 7 11", "weight": 1},
            {"input": "10", "expected_output": "2 3 5 7 11 13 17 19 23 29", "weight": 2},
            {"input": "1", "expected_output": "2", "weight": 1},
        ], points=4,
    ),

    coding(E, ["décorateurs", "gestion-erreurs"],
        ("Implémentez un décorateur `retry(n)` qui réessaie une fonction jusqu'à n fois\n"
         "si elle lève une exception. Pour ce test : lisez n et k (échecs avant succès).\n"
         "Simulez une fonction qui échoue k fois puis réussit. Affichez 'ok' ou 'failed'."),
        [
            {"input": "3\n2", "expected_output": "ok", "weight": 1},
            {"input": "2\n3", "expected_output": "failed", "weight": 1},
            {"input": "5\n5", "expected_output": "failed", "weight": 1},
        ], points=4,
    ),

    coding(E, ["algorithmes", "tri"],
        ("Tri rapide (QuickSort) : lisez N entiers séparés par des espaces\net affichez-les triés par ordre croissant.\n(Implémenter QuickSort manuellement — pas sort() ni sorted())"),
        [
            {"input": "5 3 1 4 1 5", "expected_output": "1 1 3 4 5", "weight": 1},
            {"input": "1", "expected_output": "1", "weight": 1},
            {"input": "8 7 6 5 4 3 2 1", "expected_output": "1 2 3 4 5 6 7 8", "weight": 2},
        ], points=4,
    ),

    coding(E, ["récursion", "combinatoire"],
        "Lisez une chaîne de caractères distincts et affichez toutes ses permutations, une par ligne, triées lexicographiquement.",
        [
            {"input": "abc", "expected_output": "abc\nacb\nbac\nbca\ncab\ncba", "weight": 2},
            {"input": "ab", "expected_output": "ab\nba", "weight": 1},
            {"input": "a", "expected_output": "a", "weight": 1},
        ], points=4,
    ),

    coding(E, ["chaînes", "programmation-dynamique"],
        "Lisez une chaîne et affichez la longueur de la plus longue sous-chaîne palindrome.",
        [
            {"input": "babad", "expected_output": "3", "weight": 1},
            {"input": "cbbd", "expected_output": "2", "weight": 1},
            {"input": "racecar", "expected_output": "7", "weight": 1},
            {"input": "a", "expected_output": "1", "weight": 1},
        ], points=4,
    ),

    coding(E, ["graphes", "BFS"],
        ("BFS sur graphe non orienté.\n"
         "Lisez N (noeuds 0..N-1), puis M arêtes (une par ligne : 'u v'),\n"
         "puis le noeud source. Affichez l'ordre de découverte BFS, séparé par des espaces."),
        [
            {"input": "4\n4\n0 1\n0 2\n1 3\n2 3\n0", "expected_output": "0 1 2 3", "weight": 2},
            {"input": "3\n2\n0 1\n1 2\n0", "expected_output": "0 1 2", "weight": 1},
        ], points=5,
    ),

    coding(E, ["décorateurs", "performance"],
        ("Implémentez un décorateur `@chrono` qui mesure et affiche le temps d'exécution\n"
         "d'une fonction. Pour ce test : décorez une fonction `slow(n)` qui fait sum(range(n)).\n"
         "Lisez N. Affichez le résultat, puis 'temps: <float>s' (1 décimale)."),
        [
            {"input": "1000000", "expected_output": "499999500000\ntemps: 0.0s", "weight": 1},
        ], points=3,
    ),

    coding(E, ["chaînes", "compression"],
        ("Encodage RLE : lisez une chaîne et affichez sa version compressée RLE.\n"
         "Ex: 'aaabbc' → '3a2b1c'. Si un caractère est seul, quand même écrire '1x'."),
        [
            {"input": "aaabbc", "expected_output": "3a2b1c", "weight": 1},
            {"input": "python", "expected_output": "1p1y1t1h1o1n", "weight": 1},
            {"input": "aaaa", "expected_output": "4a", "weight": 1},
        ], points=2,
    ),

    coding(E, ["programmation-dynamique", "monnaie"],
        ("Rendu de monnaie : lisez le montant M puis N valeurs de pièces (une par ligne).\n"
         "Affichez le nombre minimum de pièces nécessaires, ou -1 si impossible."),
        [
            {"input": "11\n3\n1\n5\n6", "expected_output": "2", "weight": 1},
            {"input": "3\n2\n2\n4", "expected_output": "-1", "weight": 1},
            {"input": "10\n4\n1\n2\n5\n10", "expected_output": "1", "weight": 1},
        ], points=5,
    ),

    coding(E, ["graphes", "composantes-connexes"],
        ("Lisez N noeuds (0..N-1), puis M arêtes ('u v' une par ligne).\n"
         "Affichez le nombre de composantes connexes du graphe non orienté."),
        [
            {"input": "5\n3\n0 1\n1 2\n3 4", "expected_output": "2", "weight": 1},
            {"input": "4\n0", "expected_output": "4", "weight": 1},
            {"input": "3\n3\n0 1\n1 2\n0 2", "expected_output": "1", "weight": 1},
        ], points=4,
    ),

    coding(E, ["OOP-avancé", "itérateurs"],
        ("Implémentez une classe `Range2D(rows, cols)` qui itère sur toutes les paires (i, j)\n"
         "avec 0 ≤ i < rows, 0 ≤ j < cols, dans l'ordre ligne par ligne.\n"
         "Lisez rows et cols, puis affichez chaque paire sur une ligne."),
        [
            {"input": "2\n3", "expected_output": "0 0\n0 1\n0 2\n1 0\n1 1\n1 2", "weight": 2},
            {"input": "1\n1", "expected_output": "0 0", "weight": 1},
        ], points=4,
    ),

    coding(E, ["récursion", "backtracking"],
        ("N-Reines : lisez N et affichez le **nombre** de façons de placer N reines\n"
         "sur un échiquier N×N sans qu'elles se menacent mutuellement."),
        [
            {"input": "1", "expected_output": "1", "weight": 1},
            {"input": "4", "expected_output": "2", "weight": 1},
            {"input": "8", "expected_output": "92", "weight": 3},
        ], points=5,
    ),
]

# ── Seeding ───────────────────────────────────────────────────────────────────

async def seed_bank() -> None:
    async with AsyncSessionLocal() as db:
        # Idempotence
        count_result = await db.execute(select(func.count()).select_from(BankQuestion))
        count = count_result.scalar() or 0
        if count > 0:
            print(f"La banque contient déjà {count} question(s). Abandon.")
            return

        admin_result = await db.execute(select(User).where(User.email == "admin@pyexam.com"))
        admin = admin_result.scalar_one_or_none()
        if admin is None:
            print("Admin introuvable. Lancez d'abord seed.py.")
            return

        stats: dict[str, int] = {}
        for q_data in QUESTIONS:
            q = BankQuestion(
                type=q_data["type"],
                difficulty=q_data["difficulty"],
                tags=q_data["tags"],
                statement=q_data["statement"],
                points=q_data["points"],
                test_cases=q_data.get("test_cases"),
                created_by=admin.id,
            )
            db.add(q)
            await db.flush()

            for opt in q_data.get("options", []):
                db.add(BankMCQOption(question_id=q.id, **opt))

            key = q_data["difficulty"].value
            stats[key] = stats.get(key, 0) + 1

        await db.commit()

    total = len(QUESTIONS)
    print(f"✓ {total} questions ajoutées à la banque :")
    for level in ["beginner", "intermediate", "expert"]:
        label = {"beginner": "Débutant", "intermediate": "Intermédiaire", "expert": "Expert"}[level]
        print(f"   {label:15s} : {stats.get(level, 0)}")


if __name__ == "__main__":
    asyncio.run(seed_bank())
