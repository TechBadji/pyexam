"""Peuplement de la banque de questions C.

Usage : docker compose exec backend python seed_bank_c.py

70 QCM · 10 coding · 10 culture générale
Toutes les questions ont le tag "c" pour permettre le filtrage.
"""

import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.question import QuestionType
from app.models.question_bank import BankMCQOption, BankQuestion, DifficultyLevel
from app.models.user import User

# ── helpers ───────────────────────────────────────────────────────────────────

def mcq(difficulty, tags, statement, options, points=1.0):
    correct = [o for o in options if o[2]]
    assert len(correct) == 1, f"Exactement une réponse correcte requise : {statement[:60]}"
    return {
        "type": QuestionType.mcq,
        "difficulty": difficulty,
        "tags": ["c"] + [t for t in tags if t != "c"],
        "statement": statement,
        "points": points,
        "options": [{"label": l, "text": t, "is_correct": c} for l, t, c in options],
    }


def coding(difficulty, tags, statement, test_cases, points=2.0):
    return {
        "type": QuestionType.coding,
        "difficulty": difficulty,
        "tags": ["c"] + [t for t in tags if t != "c"],
        "statement": statement,
        "points": points,
        "test_cases": test_cases,
        "language": "c",
    }


B = DifficultyLevel.beginner
I = DifficultyLevel.intermediate
E = DifficultyLevel.expert
C = DifficultyLevel.culture

# ── QUESTIONS ─────────────────────────────────────────────────────────────────

QUESTIONS = [

    # ════════════════════════════════════════════════════════════════════════
    # QCM — BASES : TYPES, VARIABLES, OPÉRATEURS  (15 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["types", "bases"],
        "Quelle est la taille en octets d'un `int` sur la plupart des architectures 64 bits ?", [
        ("A", "2", False), ("B", "4", True), ("C", "8", False), ("D", "16", False),
    ]),

    mcq(B, ["types", "bases"],
        "Quel type C est garanti de pouvoir contenir au moins 8 bits ?", [
        ("A", "int", False), ("B", "short", False), ("C", "char", True), ("D", "long", False),
    ]),

    mcq(B, ["opérateurs", "bases"],
        "Que vaut l'expression `7 % 3` en C ?", [
        ("A", "2", False), ("B", "1", True), ("C", "0", False), ("D", "2.33", False),
    ]),

    mcq(B, ["opérateurs", "bits"],
        "Que vaut `5 & 3` en C (opérateur ET bit à bit) ?", [
        ("A", "7", False), ("B", "2", False), ("C", "1", True), ("D", "0", False),
    ]),

    mcq(B, ["opérateurs", "bits"],
        "Que vaut `5 | 3` en C (opérateur OU bit à bit) ?", [
        ("A", "2", False), ("B", "7", True), ("C", "15", False), ("D", "1", False),
    ]),

    mcq(B, ["types", "cast"],
        "Que vaut `(int) 3.9` en C ?", [
        ("A", "4", False), ("B", "3", True), ("C", "3.9", False), ("D", "Erreur de compilation", False),
    ]),

    mcq(B, ["opérateurs", "incrémentation"],
        "Si `x = 5`, que vaut `x++` au moment de l'évaluation de l'expression ?", [
        ("A", "6", False), ("B", "5", True), ("C", "4", False), ("D", "Indéfini", False),
    ]),

    mcq(B, ["opérateurs", "incrémentation"],
        "Si `x = 5`, que vaut `++x` au moment de l'évaluation de l'expression ?", [
        ("A", "5", False), ("B", "6", True), ("C", "4", False), ("D", "Indéfini", False),
    ]),

    mcq(B, ["types", "signed"],
        "Quel mot-clé indique qu'un entier ne peut pas être négatif en C ?", [
        ("A", "positive", False), ("B", "unsigned", True), ("C", "ulong", False), ("D", "abs", False),
    ]),

    mcq(B, ["constantes", "bases"],
        "Quel mot-clé permet de déclarer une constante non modifiable en C ?", [
        ("A", "final", False), ("B", "static", False), ("C", "const", True), ("D", "immutable", False),
    ]),

    mcq(B, ["opérateurs", "décalage"],
        "Que vaut `1 << 4` en C ?", [
        ("A", "4", False), ("B", "8", False), ("C", "16", True), ("D", "64", False),
    ]),

    mcq(B, ["bases", "variables"],
        "Quelle est la valeur initiale d'une variable locale non initialisée en C ?", [
        ("A", "0", False), ("B", "NULL", False),
        ("C", "Indéterminée (comportement indéfini)", True),
        ("D", "-1", False),
    ]),

    mcq(I, ["opérateurs", "ternaire"],
        "Que retourne `(10 > 5) ? 'A' : 'B'` en C ?", [
        ("A", "'B'", False), ("B", "'A'", True), ("C", "1", False), ("D", "Erreur", False),
    ]),

    mcq(I, ["types", "sizeof"],
        "Que retourne `sizeof(char)` en C selon la norme ?", [
        ("A", "0", False), ("B", "1", True), ("C", "2", False), ("D", "Dépend de l'architecture", False),
    ]),

    mcq(I, ["opérateurs", "logiques"],
        "En C, quelle valeur représente `faux` dans un contexte booléen ?", [
        ("A", "false", False), ("B", "NULL", False), ("C", "0", True), ("D", "-1", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # QCM — CONTRÔLE DE FLUX  (8 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["contrôle", "switch"],
        "Dans un `switch`, que se passe-t-il si on oublie le mot-clé `break` ?", [
        ("A", "Erreur de compilation", False),
        ("B", "Exécution séquentielle des cases suivants (fall-through)", True),
        ("C", "Sortie immédiate du switch", False),
        ("D", "Comportement indéfini", False),
    ]),

    mcq(B, ["contrôle", "boucles"],
        "Quelle est la différence entre `while` et `do...while` en C ?", [
        ("A", "Aucune différence", False),
        ("B", "`do...while` exécute le corps au moins une fois avant de tester la condition", True),
        ("C", "`while` s'exécute toujours au moins une fois", False),
        ("D", "`do...while` est plus rapide", False),
    ]),

    mcq(B, ["contrôle", "for"],
        "La boucle `for (int i=0; i<5; i++)` s'exécute combien de fois ?", [
        ("A", "4", False), ("B", "5", True), ("C", "6", False), ("D", "Indéterminé", False),
    ]),

    mcq(I, ["contrôle", "goto"],
        "Quel mot-clé en C permet un saut inconditionnel vers une étiquette (label) ?", [
        ("A", "jump", False), ("B", "goto", True), ("C", "skip", False), ("D", "branch", False),
    ]),

    mcq(I, ["contrôle", "continue"],
        "Que fait `continue` dans une boucle C ?", [
        ("A", "Sort de la boucle", False),
        ("B", "Passe immédiatement à l'itération suivante", True),
        ("C", "Recommence la boucle depuis le début", False),
        ("D", "Ne fait rien", False),
    ]),

    mcq(I, ["contrôle", "conditions"],
        "En C, `if (x = 5)` (avec un seul `=`) est-il valide ?", [
        ("A", "Non, erreur de compilation", False),
        ("B", "Oui, assigne 5 à x et la condition vaut toujours vrai (5 != 0)", True),
        ("C", "Oui, mais la condition vaut faux si x était 0", False),
        ("D", "Comportement indéfini", False),
    ]),

    mcq(I, ["contrôle", "switch"],
        "Quel type de valeur peut-on utiliser dans un `switch` en C ?", [
        ("A", "Uniquement des entiers et des caractères", True),
        ("B", "N'importe quel type, y compris les flottants", False),
        ("C", "Uniquement des chaînes de caractères", False),
        ("D", "Uniquement des booléens", False),
    ]),

    mcq(E, ["contrôle", "boucles"],
        "Quelle boucle `for` est équivalente à `while(1)` (boucle infinie) ?", [
        ("A", "`for (;;)`", True),
        ("B", "`for (;0;)`", False),
        ("C", "`for (int i=0;; i++)`", False),
        ("D", "`for (1;;)`", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # QCM — FONCTIONS ET RÉCURSION  (8 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["fonctions", "bases"],
        "Quel type de retour indique qu'une fonction C ne retourne rien ?", [
        ("A", "null", False), ("B", "none", False), ("C", "void", True), ("D", "empty", False),
    ]),

    mcq(B, ["fonctions", "passage"],
        "En C, le passage d'arguments à une fonction est par défaut :", [
        ("A", "Par référence", False),
        ("B", "Par valeur (copie)", True),
        ("C", "Par pointeur", False),
        ("D", "Par adresse automatiquement", False),
    ]),

    mcq(I, ["fonctions", "prototype"],
        "À quoi sert la déclaration anticipée (prototype) d'une fonction en C ?", [
        ("A", "Elle alloue de la mémoire pour la fonction", False),
        ("B", "Elle informe le compilateur de la signature avant la définition complète", True),
        ("C", "Elle rend la fonction accessible depuis d'autres fichiers", False),
        ("D", "Elle est obligatoire pour toutes les fonctions", False),
    ]),

    mcq(I, ["fonctions", "récursion"],
        "Quelle est la condition nécessaire pour qu'une fonction récursive se termine ?", [
        ("A", "Utiliser `return` à chaque appel", False),
        ("B", "Avoir un cas de base (condition d'arrêt) qui ne fait pas d'appel récursif", True),
        ("C", "Être déclarée avec le mot-clé `recursive`", False),
        ("D", "Limiter la profondeur à 100 appels", False),
    ]),

    mcq(I, ["fonctions", "inline"],
        "Que signifie le mot-clé `inline` devant une fonction en C99/C11 ?", [
        ("A", "La fonction est appelée en dehors du fichier", False),
        ("B", "Le compilateur est invité à remplacer l'appel par le corps de la fonction", True),
        ("C", "La fonction ne peut pas être récursive", False),
        ("D", "La fonction est privée au fichier", False),
    ]),

    mcq(I, ["fonctions", "statique"],
        "Qu'indique `static` devant une fonction définie dans un fichier `.c` ?", [
        ("A", "La fonction ne peut pas être modifiée", False),
        ("B", "La fonction est locale au fichier (non visible depuis d'autres unités de traduction)", True),
        ("C", "La fonction est appelée une seule fois", False),
        ("D", "La fonction alloue ses variables sur le tas", False),
    ]),

    mcq(E, ["fonctions", "variadiques"],
        "Quelle macro est utilisée pour accéder aux arguments variables (`...`) d'une fonction variadique ?", [
        ("A", "va_start, va_arg, va_end (depuis `<stdarg.h>`)", True),
        ("B", "args_start, args_get, args_end", False),
        ("C", "var_list, var_next", False),
        ("D", "sizeof(...)", False),
    ]),

    mcq(E, ["fonctions", "pointeurs"],
        "Quelle est la syntaxe correcte pour déclarer un pointeur vers une fonction qui prend un `int` et retourne `double` ?", [
        ("A", "`double *f(int)`", False),
        ("B", "`double (*f)(int)`", True),
        ("C", "`*double f(int)`", False),
        ("D", "`(double *)(int) f`", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # QCM — TABLEAUX ET CHAÎNES  (10 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["tableaux", "bases"],
        "Comment déclare-t-on un tableau de 10 entiers en C ?", [
        ("A", "`int tab[10];`", True),
        ("B", "`array int tab(10);`", False),
        ("C", "`int[10] tab;`", False),
        ("D", "`int tab = new int[10];`", False),
    ]),

    mcq(B, ["tableaux", "indexation"],
        "Quel est le premier indice valide d'un tableau en C ?", [
        ("A", "1", False), ("B", "-1", False), ("C", "0", True), ("D", "Dépend de la déclaration", False),
    ]),

    mcq(B, ["chaînes", "bases"],
        "En C, une chaîne de caractères est terminée par :", [
        ("A", "un espace", False), ("B", "un retour à la ligne", False),
        ("C", "le caractère nul '\\0'", True), ("D", "EOF", False),
    ]),

    mcq(B, ["chaînes", "bibliothèque"],
        "Quelle fonction de `<string.h>` calcule la longueur d'une chaîne (hors '\\0') ?", [
        ("A", "strlen()", True), ("B", "strsize()", False), ("C", "length()", False), ("D", "sizeof()", False),
    ]),

    mcq(I, ["chaînes", "bibliothèque"],
        "Quelle fonction copie une chaîne vers une destination avec une limite de taille maximale ?", [
        ("A", "strcpy()", False), ("B", "strncpy()", True), ("C", "memcopy()", False), ("D", "sprintf()", False),
    ]),

    mcq(I, ["tableaux", "pointeurs"],
        "En C, le nom d'un tableau (sans indice) correspond à :", [
        ("A", "La taille du tableau", False),
        ("B", "L'adresse du premier élément (pointeur constant)", True),
        ("C", "Une copie du tableau", False),
        ("D", "L'adresse du dernier élément", False),
    ]),

    mcq(I, ["chaînes", "conversion"],
        "Quelle fonction convertit une chaîne en entier en C ?", [
        ("A", "int()", False), ("B", "toint()", False), ("C", "atoi()", True), ("D", "strtoint()", False),
    ]),

    mcq(I, ["tableaux", "multidimensionnel"],
        "Comment accède-t-on à l'élément ligne 2, colonne 3 d'un tableau `int m[4][5]` ?", [
        ("A", "`m[2,3]`", False), ("B", "`m[2][3]`", True), ("C", "`m(2,3)`", False), ("D", "`m[2+3]`", False),
    ]),

    mcq(E, ["chaînes", "sécurité"],
        "Pourquoi `gets()` est-elle considérée dangereuse et retirée en C11 ?", [
        ("A", "Elle est trop lente", False),
        ("B", "Elle ne vérifie pas la taille du tampon, exposant à un dépassement de tampon (buffer overflow)", True),
        ("C", "Elle ne lit que les caractères ASCII", False),
        ("D", "Elle n'est pas portable", False),
    ]),

    mcq(E, ["tableaux", "arithmétique-pointeurs"],
        "Si `int tab[] = {10, 20, 30}` et `int *p = tab`, que vaut `*(p+2)` ?", [
        ("A", "10", False), ("B", "20", False), ("C", "30", True), ("D", "Comportement indéfini", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # QCM — POINTEURS ET MÉMOIRE  (12 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["pointeurs", "bases"],
        "Quel opérateur permet d'obtenir l'adresse d'une variable en C ?", [
        ("A", "*", False), ("B", "&", True), ("C", "#", False), ("D", "@", False),
    ]),

    mcq(B, ["pointeurs", "déréférencement"],
        "Quel opérateur permet d'accéder à la valeur pointée par un pointeur ?", [
        ("A", "&", False), ("B", "->", False), ("C", "*", True), ("D", ".", False),
    ]),

    mcq(B, ["pointeurs", "null"],
        "Quelle valeur a un pointeur NULL en C ?", [
        ("A", "-1", False), ("B", "0 (adresse zéro)", True), ("C", "L'adresse 0xFFFFFFFF", False), ("D", "Indéfinie", False),
    ]),

    mcq(I, ["pointeurs", "arithmétique"],
        "Si `int *p` pointe sur `tab[0]`, que pointe `p+1` ?", [
        ("A", "L'octet suivant en mémoire", False),
        ("B", "tab[1] (avance de sizeof(int) octets)", True),
        ("C", "Comportement indéfini", False),
        ("D", "Le même élément", False),
    ]),

    mcq(I, ["mémoire", "allocation"],
        "Quelle fonction alloue un bloc de mémoire sur le tas (heap) en C ?", [
        ("A", "alloc()", False), ("B", "malloc()", True), ("C", "new()", False), ("D", "create()", False),
    ]),

    mcq(I, ["mémoire", "libération"],
        "Que faut-il faire après avoir utilisé de la mémoire allouée avec `malloc()` ?", [
        ("A", "Rien, le ramasse-miettes s'en charge", False),
        ("B", "Appeler `free()` pour libérer la mémoire", True),
        ("C", "Affecter NULL au pointeur uniquement", False),
        ("D", "Appeler `delete()`", False),
    ]),

    mcq(I, ["mémoire", "calloc"],
        "Quelle est la différence entre `malloc(n)` et `calloc(1, n)` ?", [
        ("A", "Aucune différence", False),
        ("B", "`calloc` initialise la mémoire à zéro, `malloc` ne l'initialise pas", True),
        ("C", "`malloc` est plus lent", False),
        ("D", "`calloc` ne peut allouer qu'un seul bloc", False),
    ]),

    mcq(I, ["pointeurs", "double"],
        "Que représente `int **pp` en C ?", [
        ("A", "Un tableau de pointeurs", False),
        ("B", "Un pointeur vers un pointeur vers un int", True),
        ("C", "Un pointeur de taille double", False),
        ("D", "Deux pointeurs distincts", False),
    ]),

    mcq(E, ["mémoire", "fuites"],
        "Qu'est-ce qu'une fuite mémoire (memory leak) en C ?", [
        ("A", "Un accès hors limites d'un tableau", False),
        ("B", "De la mémoire allouée sur le tas qui n'est jamais libérée", True),
        ("C", "L'utilisation d'un pointeur non initialisé", False),
        ("D", "Un débordement de la pile (stack overflow)", False),
    ]),

    mcq(E, ["pointeurs", "const"],
        "Quelle est la différence entre `const int *p` et `int * const p` ?", [
        ("A", "Aucune différence", False),
        ("B", "`const int *p` : la valeur pointée est constante ; `int * const p` : le pointeur lui-même est constant", True),
        ("C", "`const int *p` : le pointeur est constant ; `int * const p` : la valeur est constante", False),
        ("D", "Les deux déclarations sont invalides", False),
    ]),

    mcq(E, ["mémoire", "realloc"],
        "Que fait `realloc(ptr, 0)` en C ?", [
        ("A", "Lève une erreur", False),
        ("B", "Équivaut à `free(ptr)` (comportement défini par l'implémentation, souvent libère la mémoire)", True),
        ("C", "Alloue un nouveau bloc de taille minimale", False),
        ("D", "Ne fait rien", False),
    ]),

    mcq(E, ["pointeurs", "void"],
        "Qu'est-ce qu'un `void *` en C ?", [
        ("A", "Un pointeur vers rien (pointeur nul)", False),
        ("B", "Un pointeur générique pouvant pointer vers n'importe quel type de données", True),
        ("C", "Un pointeur vers une fonction sans retour", False),
        ("D", "Un pointeur interdit en C standard", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # QCM — STRUCTURES, UNIONS, ÉNUMÉRATIONS  (8 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["structures", "bases"],
        "Comment accède-t-on à un champ `age` d'une structure `s` déclarée par valeur en C ?", [
        ("A", "`s->age`", False), ("B", "`s.age`", True), ("C", "`s[age]`", False), ("D", "`s::age`", False),
    ]),

    mcq(B, ["structures", "pointeurs"],
        "Comment accède-t-on à un champ `age` via un pointeur `p` vers une structure ?", [
        ("A", "`p.age`", False), ("B", "`(*p).age` ou `p->age`", True),
        ("C", "`p[age]`", False), ("D", "`&p.age`", False),
    ]),

    mcq(I, ["structures", "typedef"],
        "Quel est l'avantage de `typedef struct { ... } Point;` par rapport à `struct Point { ... };` ?", [
        ("A", "Aucun avantage", False),
        ("B", "On peut écrire `Point p;` au lieu de `struct Point p;`", True),
        ("C", "La structure est immuable", False),
        ("D", "La structure est allouée sur le tas", False),
    ]),

    mcq(I, ["unions", "bases"],
        "Quelle est la principale caractéristique d'une `union` en C ?", [
        ("A", "Tous ses membres sont accessibles simultanément", False),
        ("B", "Elle partage la même zone mémoire pour tous ses membres (un seul à la fois)", True),
        ("C", "C'est un synonyme de structure", False),
        ("D", "Elle ne peut contenir que des types primitifs", False),
    ]),

    mcq(I, ["énumérations", "bases"],
        "Que vaut `enum {A, B, C}; printf(\"%d\", B);` en C ?", [
        ("A", "0", False), ("B", "1", True), ("C", "2", False), ("D", "B", False),
    ]),

    mcq(I, ["structures", "padding"],
        "Pourquoi le compilateur peut-il insérer du padding dans une structure C ?", [
        ("A", "Pour réduire la taille de la structure", False),
        ("B", "Pour aligner les champs sur des frontières mémoire favorables aux performances", True),
        ("C", "Pour des raisons de sécurité", False),
        ("D", "Parce que c'est obligatoire dans la norme", False),
    ]),

    mcq(E, ["structures", "champs-bits"],
        "Que représente `unsigned int flag : 1;` dans une structure C ?", [
        ("A", "Un tableau d'un seul entier", False),
        ("B", "Un champ de bits de 1 bit (bit field)", True),
        ("C", "Un pointeur d'un octet", False),
        ("D", "Une erreur de syntaxe", False),
    ]),

    mcq(E, ["structures", "auto-référence"],
        "Comment déclare-t-on correctement un nœud d'une liste chaînée en C ?", [
        ("A", "`struct Node { int val; Node *next; };`", False),
        ("B", "`struct Node { int val; struct Node *next; };`", True),
        ("C", "`typedef Node { int val; Node *next; };`", False),
        ("D", "`Node { int val; *next; };`", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # QCM — ENTRÉES/SORTIES ET FICHIERS  (5 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["I/O", "bases"],
        "Quelle fonction C permet d'afficher une chaîne formatée sur la sortie standard ?", [
        ("A", "print()", False), ("B", "printf()", True), ("C", "echo()", False), ("D", "write()", False),
    ]),

    mcq(B, ["I/O", "scanf"],
        "Pourquoi utilise-t-on `&variable` avec `scanf()` en C ?", [
        ("A", "Pour obtenir la valeur de la variable", False),
        ("B", "Pour passer l'adresse de la variable afin que scanf puisse y écrire", True),
        ("C", "Pour indiquer la taille de la variable", False),
        ("D", "C'est une convention sans signification particulière", False),
    ]),

    mcq(I, ["fichiers", "ouverture"],
        "Que retourne `fopen()` si le fichier ne peut pas être ouvert ?", [
        ("A", "0", False), ("B", "-1", False), ("C", "NULL", True), ("D", "EOF", False),
    ]),

    mcq(I, ["fichiers", "modes"],
        "Quel mode d'ouverture `fopen()` permet d'écrire à la fin d'un fichier existant ?", [
        ("A", "\"w\"", False), ("B", "\"r+\"", False), ("C", "\"a\"", True), ("D", "\"e\"", False),
    ]),

    mcq(E, ["I/O", "sprintf"],
        "Quelle est la différence entre `printf()` et `sprintf()` ?", [
        ("A", "Aucune", False),
        ("B", "`sprintf()` écrit dans un buffer (chaîne) au lieu de la sortie standard", True),
        ("C", "`sprintf()` est plus rapide", False),
        ("D", "`printf()` ne supporte pas les flottants", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # QCM — PRÉPROCESSEUR ET COMPILATION  (4 questions)
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["préprocesseur", "define"],
        "Que fait `#define PI 3.14159` en C ?", [
        ("A", "Déclare une variable constante `PI`", False),
        ("B", "Demande au préprocesseur de remplacer chaque occurrence de `PI` par `3.14159`", True),
        ("C", "Crée une fonction `PI()`", False),
        ("D", "Importe une bibliothèque mathématique", False),
    ]),

    mcq(B, ["préprocesseur", "include"],
        "Quelle est la différence entre `#include <fichier>` et `#include \"fichier\"` ?", [
        ("A", "Aucune différence", False),
        ("B", "`<>` cherche dans les répertoires système, `\"\"` cherche d'abord dans le répertoire courant", True),
        ("C", "`\"\"` est réservé aux fichiers C++", False),
        ("D", "`<>` est plus rapide à compiler", False),
    ]),

    mcq(I, ["préprocesseur", "garde"],
        "À quoi servent les gardes d'inclusion (`#ifndef HEADER_H / #define HEADER_H / #endif`) ?", [
        ("A", "À rendre le fichier plus rapide à compiler", False),
        ("B", "À éviter l'inclusion multiple d'un même fichier d'en-tête", True),
        ("C", "À protéger le code source contre la copie", False),
        ("D", "À déclarer des variables globales", False),
    ]),

    mcq(E, ["compilation", "étapes"],
        "Quelles sont les 4 étapes de la compilation d'un programme C avec GCC ?", [
        ("A", "Édition → Compilation → Édition de liens → Exécution", False),
        ("B", "Prétraitement → Compilation → Assemblage → Édition de liens", True),
        ("C", "Analyse → Optimisation → Génération de code → Exécution", False),
        ("D", "Tokenisation → Parsing → Interprétation → Exécution", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # QCM — CULTURE GÉNÉRALE C  (10 questions — difficulty=culture)
    # ════════════════════════════════════════════════════════════════════════

    mcq(C, ["culture", "histoire"],
        "Qui a créé le langage C ?", [
        ("A", "Bjarne Stroustrup", False),
        ("B", "Dennis Ritchie", True),
        ("C", "Ken Thompson", False),
        ("D", "Linus Torvalds", False),
    ]),

    mcq(C, ["culture", "histoire"],
        "En quelle décennie le langage C a-t-il été développé ?", [
        ("A", "1960", False), ("B", "1970", True), ("C", "1980", False), ("D", "1990", False),
    ]),

    mcq(C, ["culture", "histoire"],
        "Le livre de référence fondateur du langage C, surnommé 'K&R', a été écrit par :", [
        ("A", "Kernighan et Ritchie", True),
        ("B", "Knuth et Robinson", False),
        ("C", "Kernighan et Richardson", False),
        ("D", "Karp et Rabin", False),
    ]),

    mcq(C, ["culture", "standards"],
        "Quel est le premier standard ISO officiel du langage C ?", [
        ("A", "C90 (ISO C90)", True), ("B", "C99", False), ("C", "C11", False), ("D", "ANSI C 85", False),
    ]),

    mcq(C, ["culture", "héritage"],
        "Quel système d'exploitation a été réécrit en C dans les années 1970, contribuant à populariser le langage ?", [
        ("A", "MS-DOS", False), ("B", "UNIX", True), ("C", "Linux", False), ("D", "BSD", False),
    ]),

    mcq(C, ["culture", "héritage"],
        "Quel langage a directement été créé comme une extension de C en 1983 ?", [
        ("A", "Java", False), ("B", "C#", False), ("C", "C++", True), ("D", "Objective-C", False),
    ]),

    mcq(C, ["culture", "hello-world"],
        "Quel livre a popularisé le programme 'Hello, World!' comme premier exemple d'apprentissage ?", [
        ("A", "The Art of Computer Programming (Knuth)", False),
        ("B", "The C Programming Language (K&R)", True),
        ("C", "Introduction to Algorithms (CLRS)", False),
        ("D", "Structure and Interpretation of Computer Programs (SICP)", False),
    ]),

    mcq(C, ["culture", "compilateurs"],
        "GCC signifie :", [
        ("A", "Generic C Compiler", False),
        ("B", "GNU Compiler Collection", True),
        ("C", "Global C Compilation", False),
        ("D", "General C Codebase", False),
    ]),

    mcq(C, ["culture", "sécurité"],
        "Lequel des problèmes suivants est spécifiquement associé au langage C (absent dans des langages comme Python ou Java) ?", [
        ("A", "Les fuites mémoire gérées par le garbage collector", False),
        ("B", "Les dépassements de tampon (buffer overflow) dus à la gestion manuelle de la mémoire", True),
        ("C", "L'absence de pointeurs", False),
        ("D", "L'impossibilité de programmer en orienté objet", False),
    ]),

    mcq(C, ["culture", "influence"],
        "Parmi ces langages, lequel a été directement influencé par la syntaxe du C ?", [
        ("A", "Python", False), ("B", "Haskell", False), ("C", "Java", True), ("D", "COBOL", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # CODING C  (10 questions)
    # ════════════════════════════════════════════════════════════════════════

    coding(B, ["entrée-sortie", "bases"],
        ("Lisez deux entiers sur stdin (un par ligne) et affichez leur somme.\n"
         "Utilisez `scanf` pour lire et `printf` pour afficher."),
        [
            {"input": "3\n7",   "expected_output": "10", "weight": 1},
            {"input": "0\n0",   "expected_output": "0",  "weight": 1},
            {"input": "-5\n5",  "expected_output": "0",  "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["boucles", "conditions"],
        ("FizzBuzz en C : lisez N, puis pour chaque entier de 1 à N affichez :\n"
         "  - 'FizzBuzz' s'il est multiple de 3 et de 5\n"
         "  - 'Fizz' s'il est multiple de 3\n"
         "  - 'Buzz' s'il est multiple de 5\n"
         "  - le nombre lui-même sinon\n"
         "Un résultat par ligne."),
        [
            {"input": "5",  "expected_output": "1\n2\nFizz\n4\nBuzz", "weight": 1},
            {"input": "15", "expected_output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", "weight": 2},
        ], points=2,
    ),

    coding(B, ["récursion", "arithmétique"],
        ("Factorielle récursive en C.\n"
         "Lisez un entier N (0 ≤ N ≤ 12) et affichez N! (factorielle de N).\n"
         "Implémentez une fonction récursive `long long fact(int n)`."),
        [
            {"input": "0",  "expected_output": "1",       "weight": 1},
            {"input": "5",  "expected_output": "120",     "weight": 1},
            {"input": "10", "expected_output": "3628800", "weight": 1},
        ], points=2,
    ),

    coding(B, ["boucles", "suite"],
        ("Fibonacci en C : lisez N et affichez les N premiers termes de la suite de Fibonacci,\n"
         "séparés par des espaces sur une seule ligne.\n"
         "F(0)=0, F(1)=1, F(2)=1, F(3)=2, …\n"
         "Utilisez une approche itérative."),
        [
            {"input": "1", "expected_output": "0",             "weight": 1},
            {"input": "5", "expected_output": "0 1 1 2 3",     "weight": 1},
            {"input": "8", "expected_output": "0 1 1 2 3 5 8 13", "weight": 1},
        ], points=2,
    ),

    coding(B, ["tableaux", "algorithmes"],
        ("Lisez N puis N entiers (un par ligne) et affichez le maximum du tableau.\n"
         "Sans utiliser de bibliothèque de tri."),
        [
            {"input": "4\n3\n1\n7\n2", "expected_output": "7",  "weight": 1},
            {"input": "1\n-5",         "expected_output": "-5", "weight": 1},
            {"input": "3\n10\n10\n10", "expected_output": "10", "weight": 1},
        ], points=1.5,
    ),

    coding(I, ["chaînes", "inversion"],
        ("Inversion de chaîne en C.\n"
         "Lisez une chaîne (une ligne) et affichez-la à l'envers.\n"
         "Implémentez l'inversion en place sans utiliser `strrev`."),
        [
            {"input": "hello",  "expected_output": "olleh",  "weight": 1},
            {"input": "abcde",  "expected_output": "edcba",  "weight": 1},
            {"input": "a",      "expected_output": "a",      "weight": 1},
        ], points=2,
    ),

    coding(I, ["chaînes", "palindrome"],
        ("Vérification de palindrome en C.\n"
         "Lisez une chaîne et affichez '1' si elle est un palindrome, '0' sinon.\n"
         "La comparaison est sensible à la casse et prend en compte les espaces."),
        [
            {"input": "racecar", "expected_output": "1", "weight": 1},
            {"input": "hello",   "expected_output": "0", "weight": 1},
            {"input": "abcba",   "expected_output": "1", "weight": 1},
            {"input": "abcd",    "expected_output": "0", "weight": 1},
        ], points=2,
    ),

    coding(I, ["algorithmes", "tri"],
        ("Tri à bulles en C.\n"
         "Lisez N, puis N entiers (un par ligne).\n"
         "Implémentez le tri à bulles et affichez les entiers triés en ordre croissant, séparés par des espaces."),
        [
            {"input": "5\n5\n3\n1\n4\n2",    "expected_output": "1 2 3 4 5",    "weight": 1},
            {"input": "1\n42",               "expected_output": "42",            "weight": 1},
            {"input": "4\n9\n8\n7\n6",      "expected_output": "6 7 8 9",       "weight": 1},
        ], points=2.5,
    ),

    coding(I, ["arithmétique", "PGCD"],
        ("PGCD par l'algorithme d'Euclide en C.\n"
         "Lisez deux entiers positifs A et B (un par ligne) et affichez leur Plus Grand Commun Diviseur.\n"
         "Implémentez une fonction récursive ou itérative utilisant l'algorithme d'Euclide."),
        [
            {"input": "48\n18",  "expected_output": "6",  "weight": 1},
            {"input": "100\n75", "expected_output": "25", "weight": 1},
            {"input": "7\n13",   "expected_output": "1",  "weight": 1},
        ], points=2,
    ),

    coding(E, ["pointeurs", "structures"],
        ("Liste chaînée simple en C.\n"
         "Lisez N entiers (un par ligne) et construisez une liste chaînée.\n"
         "Puis affichez la liste à l'envers (dernier lu en premier), séparés par des espaces.\n"
         "Gérez la mémoire avec malloc/free."),
        [
            {"input": "4\n1\n2\n3\n4", "expected_output": "4 3 2 1", "weight": 2},
            {"input": "1\n42",         "expected_output": "42",       "weight": 1},
            {"input": "3\n5\n6\n7",   "expected_output": "7 6 5",    "weight": 1},
        ], points=4,
    ),
]

# ── Seeding ───────────────────────────────────────────────────────────────────

async def seed_c_bank() -> None:
    async with AsyncSessionLocal() as db:
        # Vérifier s'il existe déjà des questions C
        from sqlalchemy import func as sqlfunc
        from sqlalchemy.dialects.postgresql import JSONB
        count_result = await db.execute(
            select(sqlfunc.count()).select_from(BankQuestion).where(
                BankQuestion.tags.contains(["c"])
            )
        )
        count = count_result.scalar() or 0
        if count > 0:
            print(f"La banque contient déjà {count} question(s) taguées 'c'. Abandon.")
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

    type_stats: dict[str, int] = {}
    for q_data in QUESTIONS:
        k = q_data["type"].value
        type_stats[k] = type_stats.get(k, 0) + 1

    total = len(QUESTIONS)
    print(f"✓ {total} questions C ajoutées à la banque :")
    for level in ["beginner", "intermediate", "expert", "culture"]:
        label = {"beginner": "Débutant", "intermediate": "Intermédiaire", "expert": "Expert", "culture": "Culture générale"}[level]
        print(f"   {label:20s} : {stats.get(level, 0)}")
    print(f"\n   QCM    : {type_stats.get('mcq', 0)}")
    print(f"   Coding : {type_stats.get('coding', 0)}")


if __name__ == "__main__":
    asyncio.run(seed_c_bank())
