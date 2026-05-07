"""20 exercices algorithmiques pour la banque de questions.

10 débutant + 10 intermédiaire — axés algorithmes.

Usage : docker compose exec backend python seed_bank_algo.py
Idempotent : ne s'exécute pas une deuxième fois si déjà appliqué.
"""

import asyncio

from sqlalchemy import func, select

from app.database import AsyncSessionLocal
from app.models.question import QuestionType
from app.models.question_bank import BankQuestion, DifficultyLevel
from app.models.user import User

B = DifficultyLevel.beginner
I = DifficultyLevel.intermediate

MARKER_TAG = "algo-pack-v1"


def coding(difficulty, tags, statement, test_cases, points=2.0):
    return {
        "type": QuestionType.coding,
        "difficulty": difficulty,
        "tags": [MARKER_TAG] + tags,
        "statement": statement,
        "points": points,
        "test_cases": test_cases,
    }


QUESTIONS = [

    # ════════════════════════════════════════════════════════════════════════
    # DÉBUTANT — 10 exercices
    # ════════════════════════════════════════════════════════════════════════

    coding(B, ["algorithmes", "chiffres"],
        "Lisez un entier positif N et affichez la somme de ses chiffres.",
        [
            {"input": "123",  "expected_output": "6",  "weight": 1},
            {"input": "9999", "expected_output": "36", "weight": 1},
            {"input": "10",   "expected_output": "1",  "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["boucles", "multiplication"],
        ("Lisez un entier N et affichez sa table de multiplication de 1 à 10.\n"
         "Format de chaque ligne : 'N x K = R'."),
        [
            {"input": "3", "expected_output": (
                "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n"
                "3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30"
            ), "weight": 1},
            {"input": "7", "expected_output": (
                "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n"
                "7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70"
            ), "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["boucles", "motifs"],
        ("Lisez un entier N et affichez un triangle rectangle d'étoiles de N lignes.\n"
         "Ligne 1 : 1 étoile, ligne 2 : 2 étoiles, …, ligne N : N étoiles."),
        [
            {"input": "3", "expected_output": "*\n**\n***",          "weight": 1},
            {"input": "5", "expected_output": "*\n**\n***\n****\n*****", "weight": 1},
            {"input": "1", "expected_output": "*",                   "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["arithmétique", "PGCD"],
        ("Lisez deux entiers positifs A et B (sur deux lignes) et affichez leur PGCD "
         "(plus grand commun diviseur).\nUtilisez l'algorithme d'Euclide."),
        [
            {"input": "48\n18",  "expected_output": "6",  "weight": 1},
            {"input": "100\n75", "expected_output": "25", "weight": 1},
            {"input": "7\n13",   "expected_output": "1",  "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["arithmétique", "diviseurs"],
        ("Lisez un entier positif N et affichez tous ses diviseurs en ordre croissant, "
         "séparés par des espaces."),
        [
            {"input": "12", "expected_output": "1 2 3 4 6 12", "weight": 1},
            {"input": "7",  "expected_output": "1 7",          "weight": 1},
            {"input": "1",  "expected_output": "1",            "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["chaînes", "boucles"],
        "Lisez une phrase et affichez ses mots dans l'ordre inverse, séparés par des espaces.",
        [
            {"input": "bonjour monde python", "expected_output": "python monde bonjour", "weight": 1},
            {"input": "je suis etudiant",     "expected_output": "etudiant suis je",     "weight": 1},
            {"input": "hello",                "expected_output": "hello",                "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["chaînes", "comptage"],
        ("Lisez une chaîne puis un caractère (sur deux lignes).\n"
         "Affichez le nombre d'occurrences du caractère dans la chaîne (insensible à la casse)."),
        [
            {"input": "mississippi\ns", "expected_output": "4", "weight": 1},
            {"input": "Python\np",      "expected_output": "1", "weight": 1},
            {"input": "abcdef\nz",      "expected_output": "0", "weight": 1},
        ], points=1.5,
    ),

    coding(B, ["listes", "algorithmes"],
        ("Lisez des entiers séparés par des espaces et affichez le minimum puis le maximum, "
         "séparés par un espace.\n**Sans utiliser min() ni max().**"),
        [
            {"input": "5 3 8 1 9 2", "expected_output": "1 9",   "weight": 1},
            {"input": "42",          "expected_output": "42 42",  "weight": 1},
            {"input": "-5 0 5",      "expected_output": "-5 5",   "weight": 1},
        ], points=2,
    ),

    coding(B, ["algorithmes", "tri"],
        ("Implémentez le **tri à bulles** (bubble sort).\n"
         "Lisez des entiers séparés par des espaces et affichez-les triés par ordre croissant.\n"
         "(Interdit d'utiliser sort() ou sorted().)"),
        [
            {"input": "5 3 1 4 2",       "expected_output": "1 2 3 4 5",       "weight": 1},
            {"input": "9 8 7 6 5 4 3 2 1","expected_output": "1 2 3 4 5 6 7 8 9","weight": 1},
            {"input": "1",                "expected_output": "1",               "weight": 1},
        ], points=2,
    ),

    coding(B, ["arithmétique", "multiples"],
        ("Lisez deux entiers N et K (sur deux lignes).\n"
         "Affichez la somme de tous les multiples de K compris entre 1 et N (inclus).\n"
         "Si aucun multiple n'existe, affichez 0."),
        [
            {"input": "20\n3",  "expected_output": "63", "weight": 1},
            {"input": "10\n2",  "expected_output": "30", "weight": 1},
            {"input": "5\n6",   "expected_output": "0",  "weight": 1},
        ], points=1.5,
    ),

    # ════════════════════════════════════════════════════════════════════════
    # INTERMÉDIAIRE — 10 exercices
    # ════════════════════════════════════════════════════════════════════════

    coding(I, ["algorithmes", "tri"],
        ("Implémentez le **tri par insertion** (insertion sort).\n"
         "Lisez des entiers séparés par des espaces et affichez-les triés par ordre croissant.\n"
         "(Interdit d'utiliser sort() ou sorted().)"),
        [
            {"input": "5 3 1 4 2",    "expected_output": "1 2 3 4 5",    "weight": 1},
            {"input": "9 1 9 1 9 1",  "expected_output": "1 1 1 9 9 9",  "weight": 1},
            {"input": "42",           "expected_output": "42",           "weight": 1},
        ], points=2,
    ),

    coding(I, ["listes", "rotation"],
        ("Lisez des entiers séparés par des espaces (première ligne), puis K (deuxième ligne).\n"
         "Affichez le tableau après rotation à droite de K positions.\n"
         "Exemple : [1,2,3,4,5], K=2 → [4,5,1,2,3]."),
        [
            {"input": "1 2 3 4 5\n2", "expected_output": "4 5 1 2 3", "weight": 1},
            {"input": "1 2 3\n4",     "expected_output": "3 1 2",     "weight": 1},
            {"input": "1\n100",       "expected_output": "1",         "weight": 1},
        ], points=2,
    ),

    coding(I, ["suites", "algorithmes"],
        ("Suite de Collatz : en partant de N, appliquer la règle suivante jusqu'à atteindre 1 :\n"
         "  - si N est pair → N = N / 2\n"
         "  - si N est impair → N = 3N + 1\n"
         "Lisez N et affichez le nombre d'étapes pour atteindre 1."),
        [
            {"input": "6",  "expected_output": "8",   "weight": 1},
            {"input": "1",  "expected_output": "0",   "weight": 1},
            {"input": "27", "expected_output": "111", "weight": 2},
        ], points=2,
    ),

    coding(I, ["algorithmes", "tableaux"],
        ("Sous-tableau de somme maximale (algorithme de Kadane).\n"
         "Lisez des entiers séparés par des espaces et affichez la somme maximale "
         "d'un sous-tableau contigu non vide."),
        [
            {"input": "-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6",  "weight": 2},
            {"input": "-1 -2 -3",               "expected_output": "-1", "weight": 1},
            {"input": "1 2 3 4 5",              "expected_output": "15", "weight": 1},
        ], points=3,
    ),

    coding(I, ["programmation-dynamique", "matrices"],
        ("Nombre de chemins dans une grille : lisez M puis N (lignes et colonnes, sur deux lignes).\n"
         "Affichez le nombre de chemins du coin supérieur gauche au coin inférieur droit,\n"
         "en ne se déplaçant qu'**vers le bas** ou **vers la droite**."),
        [
            {"input": "3\n3", "expected_output": "6",  "weight": 1},
            {"input": "2\n2", "expected_output": "2",  "weight": 1},
            {"input": "3\n7", "expected_output": "28", "weight": 1},
        ], points=3,
    ),

    coding(I, ["arithmétique", "PGCD-PPCM"],
        ("Lisez N puis N entiers (un par ligne).\n"
         "Affichez sur deux lignes leur PGCD puis leur PPCM."),
        [
            {"input": "3\n12\n18\n24", "expected_output": "6\n72",  "weight": 1},
            {"input": "2\n7\n13",      "expected_output": "1\n91",  "weight": 1},
            {"input": "1\n42",         "expected_output": "42\n42", "weight": 1},
        ], points=2,
    ),

    coding(I, ["listes", "ensembles"],
        ("Lisez N puis N entiers sur une ligne (liste A triée), puis M puis M entiers "
         "sur une ligne (liste B triée).\n"
         "Affichez les éléments communs sans doublons, triés, séparés par des espaces.\n"
         "Si aucun élément commun, affichez 'vide'."),
        [
            {"input": "5\n1 2 3 4 5\n4\n3 4 5 6", "expected_output": "3 4 5", "weight": 1},
            {"input": "3\n1 3 5\n3\n2 4 6",       "expected_output": "vide",  "weight": 1},
            {"input": "3\n1 2 3\n3\n1 2 3",        "expected_output": "1 2 3", "weight": 1},
        ], points=2,
    ),

    coding(I, ["programmation-dynamique", "suites"],
        ("Longueur de la plus longue sous-séquence **strictement croissante** (LIS).\n"
         "Lisez des entiers séparés par des espaces et affichez la longueur de la LIS."),
        [
            {"input": "10 9 2 5 3 7 101 18", "expected_output": "4", "weight": 2},
            {"input": "1 2 3 4 5",           "expected_output": "5", "weight": 1},
            {"input": "5 4 3 2 1",           "expected_output": "1", "weight": 1},
        ], points=3,
    ),

    coding(I, ["chaînes", "compression"],
        ("Compressez une chaîne en remplaçant les suites de caractères identiques.\n"
         "Format : caractère suivi du nombre d'occurrences, mais si le nombre vaut 1, "
         "ne pas l'écrire.\n"
         "Exemple : 'aaabbc' → 'a3b2c', 'abcd' → 'abcd'."),
        [
            {"input": "aaabbc",   "expected_output": "a3b2c",    "weight": 1},
            {"input": "aabbccdd", "expected_output": "a2b2c2d2", "weight": 1},
            {"input": "abcd",     "expected_output": "abcd",     "weight": 1},
            {"input": "aaaa",     "expected_output": "a4",       "weight": 1},
        ], points=2,
    ),

    coding(I, ["algorithmes", "arithmétique"],
        ("Exponentiation rapide : lisez B et N (sur deux lignes).\n"
         "Calculez B^N modulo 10^9+7 en implémentant l'algorithme d'exponentiation "
         "rapide (O(log N)).\n"
         "Sans utiliser pow() avec 3 arguments ni l'opérateur ** directement."),
        [
            {"input": "2\n10",  "expected_output": "1024",     "weight": 1},
            {"input": "3\n0",   "expected_output": "1",        "weight": 1},
            {"input": "2\n30",  "expected_output": "73741817", "weight": 2},
        ], points=3,
    ),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        # Idempotence : vérifier si le pack est déjà présent
        result = await db.execute(
            select(func.count()).select_from(BankQuestion).where(
                BankQuestion.tags.contains([MARKER_TAG])
            )
        )
        count = result.scalar() or 0
        if count > 0:
            print(f"Pack déjà présent ({count} question(s) avec le tag '{MARKER_TAG}'). Abandon.")
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
            key = q_data["difficulty"].value
            stats[key] = stats.get(key, 0) + 1

        await db.commit()

    total = len(QUESTIONS)
    print(f"✓ {total} exercices algorithmiques ajoutés à la banque :")
    for level in ["beginner", "intermediate"]:
        label = {"beginner": "Débutant", "intermediate": "Intermédiaire"}[level]
        print(f"   {label:15s} : {stats.get(level, 0)}")


if __name__ == "__main__":
    asyncio.run(seed())
