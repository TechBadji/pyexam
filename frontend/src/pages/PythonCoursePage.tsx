import { Link } from "react-router-dom";

// ── Primitives ─────────────────────────────────────────────────────────────────

const Code = ({ children, label }: { children: string; label?: string }) => (
  <div className="rounded-xl overflow-hidden border border-gray-700 shadow-md my-2">
    {label && (
      <div className="bg-gray-800 px-4 py-1.5 flex items-center gap-2 border-b border-gray-700">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-xs font-mono text-gray-400">{label}</span>
      </div>
    )}
    <pre className="bg-gray-900 text-gray-100 px-5 py-4 text-sm font-mono overflow-x-auto leading-relaxed">
      {children.trimStart()}
    </pre>
  </div>
);

const C = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded text-[0.85em] font-mono">
    {children}
  </code>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 px-4 py-3 text-blue-800 dark:text-blue-300 text-sm rounded-r-lg">
    <span className="font-semibold block mb-0.5">A retenir</span>
    {children}
  </div>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 px-4 py-3 text-green-800 dark:text-green-300 text-sm rounded-r-lg">
    <span className="font-semibold block mb-0.5">Bonne pratique</span>
    {children}
  </div>
);

const Warn = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 px-4 py-3 text-amber-800 dark:text-amber-300 text-sm rounded-r-lg">
    <span className="font-semibold block mb-0.5">Attention</span>
    {children}
  </div>
);

const H2 = ({ id, num, title }: { id: string; num: number; title: string }) => (
  <h2
    id={id}
    className="scroll-mt-24 flex items-center gap-3 text-xl font-extrabold text-gray-900 dark:text-white pb-3 border-b-2 border-brand-200 dark:border-brand-800 mt-2"
  >
    <span className="shrink-0 w-8 h-8 rounded-lg bg-brand-600 text-white text-sm font-black flex items-center justify-center">
      {num}
    </span>
    {title}
  </h2>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wide mt-6 mb-3">
    {children}
  </h3>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>
);

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {headers.map((h) => (
            <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((row, i) => (
          <tr key={i} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
            {row.map((cell, j) => (
              <td key={j} className={`px-4 py-2.5 text-gray-700 dark:text-gray-300 ${j === 0 ? "font-mono font-semibold text-brand-600 dark:text-brand-400" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── TOC ────────────────────────────────────────────────────────────────────────

const chapters = [
  { id: "introduction", num: 1, title: "Introduction à Python" },
  { id: "variables", num: 2, title: "Variables et types" },
  { id: "operateurs", num: 3, title: "Opérateurs" },
  { id: "conditions", num: 4, title: "Conditions" },
  { id: "boucles", num: 5, title: "Boucles" },
  { id: "fonctions", num: 6, title: "Fonctions" },
  { id: "listes", num: 7, title: "Listes et tuples" },
  { id: "dictionnaires", num: 8, title: "Dictionnaires et ensembles" },
  { id: "chaines", num: 9, title: "Chaînes de caractères" },
  { id: "fichiers", num: 10, title: "Fichiers" },
  { id: "exceptions", num: 11, title: "Gestion des erreurs" },
  { id: "modules", num: 12, title: "Modules et bibliothèques" },
  { id: "poo", num: 13, title: "Programmation orientée objet" },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PythonCoursePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* Header */}
      <header className="bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 text-white py-10 px-4 print:py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Cours Python pour débutants</h1>
              <p className="text-brand-200 text-sm mt-1">
                De l'installation au premier programme — 13 chapitres complets
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                {["Syntaxe", "Variables", "Boucles", "Fonctions", "Collections", "POO"].map((tag) => (
                  <span key={tag} className="bg-white/15 border border-white/20 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3 print:hidden">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-4 py-2 rounded-lg hover:bg-brand-50 transition text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 flex gap-8">

        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0 print:hidden">
          <div className="sticky top-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Sommaire</p>
            <nav className="space-y-0.5">
              {chapters.map((ch) => (
                <a
                  key={ch.id}
                  href={`#${ch.id}`}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 py-1.5 px-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 transition group"
                >
                  <span className="shrink-0 w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 text-gray-500 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 text-[10px] font-bold flex items-center justify-center transition">
                    {ch.num}
                  </span>
                  <span className="leading-snug">{ch.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-14">

          {/* ── CHAPITRE 1 ──────────────────────────────────────────────── */}
          <section id="introduction" className="space-y-5">
            <H2 id="introduction" num={1} title="Introduction à Python" />

            <H3>Qu'est-ce que Python ?</H3>
            <P>
              Python est un langage de programmation <strong>généraliste</strong>, créé par Guido van Rossum en 1991.
              Il est réputé pour sa syntaxe claire et lisible, proche du langage naturel.
              On l'utilise dans des domaines très variés : scripts d'automatisation, développement web,
              analyse de données, intelligence artificielle, et bien sûr l'enseignement de la programmation.
            </P>

            <H3>Caractéristiques principales</H3>
            <ul className="list-none space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {[
                ["Interprété", "Le code est exécuté ligne par ligne, sans compilation préalable."],
                ["Typé dynamiquement", "Le type d'une variable est déterminé automatiquement à l'exécution."],
                ["Multiparadigme", "Python supporte la programmation impérative, fonctionnelle et orientée objet."],
                ["Batteries incluses", "La bibliothèque standard est très riche : fichiers, réseau, math, dates..."],
                ["Indentation obligatoire", "L'indentation définit les blocs de code. Ce n'est pas une convention, c'est une règle syntaxique."],
              ].map(([titre, desc]) => (
                <li key={titre} className="flex gap-3 items-start">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-brand-500 mt-2" />
                  <span><strong>{titre}</strong> — {desc}</span>
                </li>
              ))}
            </ul>

            <H3>Le premier programme</H3>
            <P>Par convention, le premier programme affiche un message à l'écran :</P>
            <Code label="bonjour.py">{`print("Bonjour, monde !")`}</Code>

            <H3>Commentaires</H3>
            <P>Un commentaire commence par le symbole <C>#</C>. Python l'ignore complètement à l'exécution.</P>
            <Code label="commentaires.py">{`# Ceci est un commentaire
print("Bonjour")  # Commentaire en fin de ligne

# Les commentaires servent à expliquer le code,
# pas à dupliquer ce que le code dit déjà.`}</Code>

            <H3>Indentation</H3>
            <P>L'indentation (décalage par des espaces ou une tabulation) délimite les blocs. Un manque ou un excès d'indentation provoque une erreur.</P>
            <Code label="indentation.py">{`if True:
    print("Ce message est dans le bloc if")
    print("Cette ligne aussi")
print("Cette ligne est hors du bloc if")`}</Code>
            <Warn>Python est sensible à la casse : <C>Print</C> n'est pas la même chose que <C>print</C>. Utilisez toujours des minuscules pour les fonctions intégrées.</Warn>
          </section>

          {/* ── CHAPITRE 2 ──────────────────────────────────────────────── */}
          <section id="variables" className="space-y-5">
            <H2 id="variables" num={2} title="Variables et types de données" />

            <H3>Déclaration d'une variable</H3>
            <P>
              En Python, on crée une variable en lui affectant directement une valeur avec le signe <C>=</C>.
              Il n'y a pas de mot-clé de déclaration comme dans d'autres langages.
            </P>
            <Code label="variables.py">{`nom = "Alice"
age = 20
moyenne = 14.5
admis = True`}</Code>

            <H3>Les types fondamentaux</H3>
            <Table
              headers={["Type", "Exemple", "Description"]}
              rows={[
                ["int", "42, -7, 0", "Nombre entier"],
                ["float", "3.14, -0.5, 2.0", "Nombre décimal (virgule flottante)"],
                ["str", '"Bonjour", \'Python\'', "Chaîne de caractères"],
                ["bool", "True, False", "Valeur booléenne (vrai / faux)"],
                ["NoneType", "None", "Absence de valeur"],
              ]}
            />

            <H3>Vérifier le type d'une variable</H3>
            <Code label="type.py">{`x = 42
print(type(x))      # <class 'int'>

y = 3.14
print(type(y))      # <class 'float'>

z = "Python"
print(type(z))      # <class 'str'>`}</Code>

            <H3>Conversion de types</H3>
            <P>On peut convertir explicitement une valeur d'un type à un autre :</P>
            <Code label="conversion.py">{`# str -> int
nombre = int("42")       # 42

# int -> float
decimal = float(10)      # 10.0

# int -> str
texte = str(100)         # "100"

# str -> bool (toute chaîne non vide vaut True)
b = bool("Python")       # True
b2 = bool("")            # False`}</Code>
            <Warn>
              La conversion échoue si la valeur n'est pas convertible :<br />
              <C>int("bonjour")</C> lève une <C>ValueError</C>.
            </Warn>

            <H3>Affectation multiple</H3>
            <Code label="affectation_multiple.py">{`# Plusieurs variables en une ligne
a, b, c = 1, 2, 3

# Même valeur pour plusieurs variables
x = y = z = 0

# Échange de deux variables sans variable temporaire
a, b = b, a`}</Code>

            <Note>Les noms de variables doivent commencer par une lettre ou un underscore, et ne contenir que des lettres, des chiffres et des underscores. La convention Python est le <strong>snake_case</strong> : <C>ma_variable</C>, <C>nombre_eleves</C>.</Note>
          </section>

          {/* ── CHAPITRE 3 ──────────────────────────────────────────────── */}
          <section id="operateurs" className="space-y-5">
            <H2 id="operateurs" num={3} title="Opérateurs" />

            <H3>Opérateurs arithmétiques</H3>
            <Table
              headers={["Opérateur", "Nom", "Exemple", "Résultat"]}
              rows={[
                ["+", "Addition", "5 + 3", "8"],
                ["-", "Soustraction", "10 - 4", "6"],
                ["*", "Multiplication", "3 * 4", "12"],
                ["/", "Division", "7 / 2", "3.5"],
                ["//", "Division entière", "7 // 2", "3"],
                ["%", "Modulo (reste)", "7 % 2", "1"],
                ["**", "Puissance", "2 ** 8", "256"],
              ]}
            />
            <Code label="arithmetique.py">{`print(17 / 5)    # 3.4   (division réelle)
print(17 // 5)   # 3     (quotient entier)
print(17 % 5)    # 2     (reste)
print(2 ** 10)   # 1024  (puissance)`}</Code>

            <H3>Opérateurs de comparaison</H3>
            <P>Ces opérateurs renvoient <C>True</C> ou <C>False</C> :</P>
            <Table
              headers={["Opérateur", "Signification"]}
              rows={[
                ["==", "Égal à"],
                ["!=", "Différent de"],
                ["<", "Strictement inférieur à"],
                [">", "Strictement supérieur à"],
                ["<=", "Inférieur ou égal à"],
                [">=", "Supérieur ou égal à"],
              ]}
            />
            <Code label="comparaison.py">{`print(5 == 5)    # True
print(5 != 3)    # True
print(10 > 20)   # False
print(7 <= 7)    # True`}</Code>

            <H3>Opérateurs logiques</H3>
            <Table
              headers={["Opérateur", "Signification", "Exemple"]}
              rows={[
                ["and", "ET logique — vrai si les deux conditions sont vraies", "age >= 18 and permis == True"],
                ["or", "OU logique — vrai si au moins une condition est vraie", "note >= 10 or rattrapage == True"],
                ["not", "NON logique — inverse le booléen", "not admis"],
              ]}
            />
            <Code label="logique.py">{`age = 20
permis = True

if age >= 18 and permis:
    print("Peut conduire")

note = 8
if note >= 10 or note >= 7:
    print("Admis ou ajourné")

print(not True)   # False
print(not False)  # True`}</Code>

            <H3>Opérateurs d'affectation composés</H3>
            <Code label="affectation_composee.py">{`x = 10
x += 3    # équivaut à x = x + 3  → 13
x -= 2    # x = x - 2             → 11
x *= 4    # x = x * 4             → 44
x //= 5   # x = x // 5           → 8
x %= 3    # x = x % 3            → 2
x **= 3   # x = x ** 3           → 8`}</Code>

            <Tip>Utilisez <C>//</C> (division entière) et <C>%</C> (modulo) pour toutes les manipulations d'indices, de parité (<C>n % 2 == 0</C> pour tester si n est pair), et de comptage cyclique.</Tip>
          </section>

          {/* ── CHAPITRE 4 ──────────────────────────────────────────────── */}
          <section id="conditions" className="space-y-5">
            <H2 id="conditions" num={4} title="Structures conditionnelles" />

            <H3>if / elif / else</H3>
            <P>La structure conditionnelle permet d'exécuter un bloc de code uniquement si une condition est vraie.</P>
            <Code label="conditions.py">{`note = 14

if note >= 16:
    print("Très bien")
elif note >= 14:
    print("Bien")
elif note >= 12:
    print("Assez bien")
elif note >= 10:
    print("Passable")
else:
    print("Insuffisant")`}</Code>

            <Note>
              <C>elif</C> est la contraction de "else if". Il peut y avoir autant de <C>elif</C> que nécessaire.
              Le bloc <C>else</C> est optionnel et s'exécute si aucune condition précédente n'est vraie.
            </Note>

            <H3>Conditions imbriquées</H3>
            <Code label="imbriquees.py">{`age = 25
nationalite = "française"

if age >= 18:
    if nationalite == "française":
        print("Peut voter en France")
    else:
        print("Majeur mais ne peut pas voter en France")
else:
    print("Mineur, ne peut pas voter")`}</Code>

            <H3>Opérateur ternaire</H3>
            <P>Python propose une syntaxe compacte pour les conditions simples sur une seule ligne :</P>
            <Code label="ternaire.py">{`# Syntaxe : valeur_si_vrai if condition else valeur_si_faux
statut = "admis" if note >= 10 else "ajourné"
print(statut)

# Équivalent à :
if note >= 10:
    statut = "admis"
else:
    statut = "ajourné"`}</Code>

            <H3>Valeurs considérées comme fausses</H3>
            <P>En Python, les valeurs suivantes sont évaluées à <C>False</C> dans un test :</P>
            <Code label="falsy.py">{`if 0:       print("jamais affiché")
if "":      print("jamais affiché")
if []:      print("jamais affiché")
if None:    print("jamais affiché")
if False:   print("jamais affiché")

# Toutes les autres valeurs sont évaluées à True
if 42:      print("affiché")
if "texte": print("affiché")
if [1, 2]:  print("affiché")`}</Code>
          </section>

          {/* ── CHAPITRE 5 ──────────────────────────────────────────────── */}
          <section id="boucles" className="space-y-5">
            <H2 id="boucles" num={5} title="Boucles" />

            <H3>La boucle for</H3>
            <P>La boucle <C>for</C> parcourt chaque élément d'une séquence (liste, chaîne, plage de nombres...).</P>
            <Code label="for.py">{`# Parcourir une liste
fruits = ["pomme", "banane", "cerise"]
for fruit in fruits:
    print(fruit)

# Parcourir une chaîne de caractères
for lettre in "Python":
    print(lettre)`}</Code>

            <H3>La fonction range()</H3>
            <P><C>range()</C> génère une séquence d'entiers. C'est l'outil principal pour répéter une action n fois.</P>
            <Code label="range.py">{`# range(stop) : de 0 à stop-1
for i in range(5):
    print(i)        # 0 1 2 3 4

# range(start, stop)
for i in range(2, 7):
    print(i)        # 2 3 4 5 6

# range(start, stop, step)
for i in range(0, 20, 5):
    print(i)        # 0 5 10 15

# Compter à rebours
for i in range(10, 0, -1):
    print(i)        # 10 9 8 ... 1`}</Code>

            <H3>La boucle while</H3>
            <P>La boucle <C>while</C> s'exécute tant qu'une condition est vraie. Elle est utile quand on ne connaît pas le nombre d'itérations à l'avance.</P>
            <Code label="while.py">{`compteur = 0

while compteur < 5:
    print(f"Compteur : {compteur}")
    compteur += 1

print("Fin de la boucle")`}</Code>
            <Warn>Assurez-vous que la condition devient un jour <C>False</C>, sinon la boucle tourne indéfiniment (boucle infinie).</Warn>

            <H3>break et continue</H3>
            <Code label="break_continue.py">{`# break : sort immédiatement de la boucle
for i in range(10):
    if i == 5:
        break
    print(i)        # affiche 0 1 2 3 4

# continue : passe à l'itération suivante
for i in range(10):
    if i % 2 == 0:
        continue    # saute les nombres pairs
    print(i)        # affiche 1 3 5 7 9`}</Code>

            <H3>enumerate() — indice et valeur</H3>
            <Code label="enumerate.py">{`langages = ["Python", "C", "Java", "JavaScript"]

for i, lang in enumerate(langages):
    print(f"{i + 1}. {lang}")
# 1. Python
# 2. C
# 3. Java
# 4. JavaScript`}</Code>

            <H3>Boucles imbriquées</H3>
            <Code label="imbriquees.py">{`# Table de multiplication (extrait)
for i in range(1, 4):
    for j in range(1, 4):
        print(f"{i} x {j} = {i * j}")`}</Code>

            <Tip>Préférez <C>for</C> à <C>while</C> chaque fois que vous connaissez la collection à parcourir. <C>while</C> est réservé aux cas où la condition d'arrêt est dynamique (saisie utilisateur, état d'un fichier, etc.).</Tip>
          </section>

          {/* ── CHAPITRE 6 ──────────────────────────────────────────────── */}
          <section id="fonctions" className="space-y-5">
            <H2 id="fonctions" num={6} title="Fonctions" />

            <H3>Définir une fonction</H3>
            <P>Une fonction regroupe un bloc de code réutilisable sous un nom. On la définit avec <C>def</C>.</P>
            <Code label="fonctions.py">{`def saluer():
    print("Bonjour !")

# Appel de la fonction
saluer()
saluer()
saluer()`}</Code>

            <H3>Paramètres et arguments</H3>
            <Code label="parametres.py">{`def saluer(prenom):
    print(f"Bonjour, {prenom} !")

saluer("Alice")
saluer("Bob")

def addition(a, b):
    print(a + b)

addition(3, 5)   # 8
addition(10, 20) # 30`}</Code>

            <H3>La valeur de retour — return</H3>
            <P>Une fonction peut retourner une valeur avec <C>return</C>. Sans <C>return</C>, elle retourne <C>None</C>.</P>
            <Code label="return.py">{`def carre(n):
    return n ** 2

resultat = carre(7)
print(resultat)          # 49
print(carre(3) + carre(4))  # 25

# Retourner plusieurs valeurs (Python retourne un tuple)
def divmod_manuel(a, b):
    return a // b, a % b

quotient, reste = divmod_manuel(17, 5)
print(quotient, reste)  # 3 2`}</Code>

            <H3>Valeurs par défaut</H3>
            <Code label="defaut.py">{`def puissance(base, exposant=2):
    return base ** exposant

print(puissance(5))     # 25  (exposant = 2 par défaut)
print(puissance(5, 3))  # 125`}</Code>

            <H3>Arguments nommés (keyword arguments)</H3>
            <Code label="kwargs.py">{`def description(nom, age, ville="Paris"):
    print(f"{nom}, {age} ans, habite à {ville}")

description("Alice", 25)
description(age=30, nom="Bob", ville="Lyon")
description("Charlie", ville="Marseille", age=22)`}</Code>

            <H3>*args et **kwargs</H3>
            <Code label="args.py">{`# *args : nombre variable d'arguments positionnels
def somme(*nombres):
    total = 0
    for n in nombres:
        total += n
    return total

print(somme(1, 2, 3))         # 6
print(somme(10, 20, 30, 40))  # 100

# **kwargs : nombre variable d'arguments nommés
def afficher_infos(**infos):
    for cle, valeur in infos.items():
        print(f"{cle} : {valeur}")

afficher_infos(nom="Alice", age=25, ville="Paris")`}</Code>

            <H3>Fonctions lambda</H3>
            <P>Une fonction lambda est une fonction anonyme sur une seule ligne :</P>
            <Code label="lambda.py">{`# lambda paramètres : expression
carre = lambda x: x ** 2
print(carre(9))   # 81

addition = lambda a, b: a + b
print(addition(3, 7))  # 10

# Utilisation courante : tri personnalisé
noms = ["Alice", "bob", "Charlie"]
noms.sort(key=lambda n: n.lower())
print(noms)  # ['Alice', 'bob', 'Charlie']`}</Code>

            <Note>Une fonction fait idéalement <strong>une seule chose</strong> et la fait bien. Si votre fonction fait plus de 20 lignes, envisagez de la découper.</Note>
          </section>

          {/* ── CHAPITRE 7 ──────────────────────────────────────────────── */}
          <section id="listes" className="space-y-5">
            <H2 id="listes" num={7} title="Listes et tuples" />

            <H3>Les listes</H3>
            <P>Une liste est une <strong>collection ordonnée et modifiable</strong>. Les éléments sont entre crochets, séparés par des virgules.</P>
            <Code label="listes.py">{`# Création
fruits = ["pomme", "banane", "cerise"]
notes = [14, 12, 18, 9, 15]
mixte = [1, "texte", True, 3.14]
vide = []

# Accès par indice (commence à 0)
print(fruits[0])    # "pomme"
print(fruits[2])    # "cerise"
print(fruits[-1])   # "cerise" (dernier élément)
print(fruits[-2])   # "banane" (avant-dernier)

# Modification
fruits[1] = "mangue"
print(fruits)  # ['pomme', 'mangue', 'cerise']`}</Code>

            <H3>Opérations sur les listes</H3>
            <Code label="operations_listes.py">{`nombres = [3, 1, 4, 1, 5, 9, 2, 6]

# Longueur
print(len(nombres))          # 8

# Ajout en fin de liste
nombres.append(5)

# Insertion à un indice donné
nombres.insert(0, 100)       # insère 100 en position 0

# Suppression par valeur
nombres.remove(1)            # supprime la première occurrence de 1

# Suppression par indice
del nombres[0]
element = nombres.pop()      # supprime et retourne le dernier élément
element = nombres.pop(2)     # supprime et retourne l'élément à l'indice 2

# Tri
nombres.sort()               # tri en place
nombres.sort(reverse=True)   # tri décroissant
trie = sorted(nombres)       # retourne une nouvelle liste triée

# Inversion
nombres.reverse()

# Recherche
print(nombres.count(5))      # nombre d'occurrences de 5
print(nombres.index(9))      # indice de la première occurrence de 9
print(9 in nombres)          # True si 9 est dans la liste`}</Code>

            <H3>Slicing (découpage)</H3>
            <Code label="slicing.py">{`lettres = ["a", "b", "c", "d", "e", "f"]
# syntaxe : liste[debut:fin:pas]  (fin exclu)

print(lettres[1:4])    # ['b', 'c', 'd']
print(lettres[:3])     # ['a', 'b', 'c']
print(lettres[3:])     # ['d', 'e', 'f']
print(lettres[::2])    # ['a', 'c', 'e']  (un sur deux)
print(lettres[::-1])   # ['f', 'e', 'd', 'c', 'b', 'a']  (inversé)`}</Code>

            <H3>Compréhensions de liste</H3>
            <P>Syntaxe concise pour créer une liste à partir d'un itérable :</P>
            <Code label="comprehensions.py">{`# [expression for element in iterable if condition]

carres = [x ** 2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

pairs = [x for x in range(20) if x % 2 == 0]
# [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

mots_longs = [mot.upper() for mot in ["chat", "chien", "éléphant"] if len(mot) > 4]
# ['CHIEN', 'ÉLÉPHANT']`}</Code>

            <H3>Les tuples</H3>
            <P>Un tuple est une <strong>collection ordonnée et immuable</strong>. On utilise des parenthèses.</P>
            <Code label="tuples.py">{`coordonnees = (48.8566, 2.3522)    # latitude, longitude
rgb = (255, 128, 0)

print(coordonnees[0])    # 48.8566
print(len(rgb))          # 3

# Un tuple d'un seul élément nécessite une virgule
singleton = (42,)
print(type(singleton))   # <class 'tuple'>

# Unpacking
lat, lon = coordonnees
r, g, b = rgb

# Immuabilité
# coordonnees[0] = 0  → TypeError: 'tuple' object does not support item assignment`}</Code>

            <Note>Utilisez les tuples pour les données qui ne doivent pas changer (coordonnées, couleurs RGB, valeurs de retour multiples). Utilisez les listes pour les collections amenées à être modifiées.</Note>
          </section>

          {/* ── CHAPITRE 8 ──────────────────────────────────────────────── */}
          <section id="dictionnaires" className="space-y-5">
            <H2 id="dictionnaires" num={8} title="Dictionnaires et ensembles" />

            <H3>Les dictionnaires</H3>
            <P>Un dictionnaire est une collection de paires <strong>clé : valeur</strong>. Les clés sont uniques et immuables. L'accès se fait par la clé, pas par un indice numérique.</P>
            <Code label="dictionnaires.py">{`# Création
etudiant = {
    "nom": "Alice",
    "age": 20,
    "notes": [14, 12, 18],
    "admis": True
}

# Accès
print(etudiant["nom"])     # "Alice"
print(etudiant["notes"])   # [14, 12, 18]

# Accès sécurisé avec .get() (ne lève pas d'erreur si la clé est absente)
print(etudiant.get("ville"))           # None
print(etudiant.get("ville", "Paris"))  # "Paris" (valeur par défaut)

# Modification et ajout
etudiant["age"] = 21
etudiant["ville"] = "Lyon"    # nouvelle clé

# Suppression
del etudiant["admis"]
valeur = etudiant.pop("ville")  # supprime et retourne la valeur`}</Code>

            <H3>Parcourir un dictionnaire</H3>
            <Code label="parcourir_dict.py">{`inventaire = {"pommes": 50, "bananes": 30, "cerises": 100}

# Clés seulement
for cle in inventaire.keys():
    print(cle)

# Valeurs seulement
for valeur in inventaire.values():
    print(valeur)

# Clés et valeurs simultanément
for cle, valeur in inventaire.items():
    print(f"{cle} : {valeur} unités")`}</Code>

            <H3>Méthodes utiles</H3>
            <Code label="methodes_dict.py">{`d = {"a": 1, "b": 2, "c": 3}

print("a" in d)               # True  (teste la présence d'une clé)
print(len(d))                 # 3
d.update({"d": 4, "e": 5})   # fusionne un autre dictionnaire
d.clear()                     # vide le dictionnaire

# Compréhension de dictionnaire
carres = {x: x**2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}`}</Code>

            <H3>Les ensembles (sets)</H3>
            <P>Un ensemble est une collection <strong>non ordonnée sans doublons</strong>. Très efficace pour tester l'appartenance.</P>
            <Code label="ensembles.py">{`# Création
couleurs = {"rouge", "vert", "bleu"}
nombres = {1, 2, 3, 4, 5}

# Suppression automatique des doublons
unique = set([1, 2, 2, 3, 3, 3, 4])
print(unique)   # {1, 2, 3, 4}

# Opérations ensemblistes
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)    # Union       : {1, 2, 3, 4, 5, 6}
print(a & b)    # Intersection: {3, 4}
print(a - b)    # Différence  : {1, 2}
print(a ^ b)    # Différence symétrique : {1, 2, 5, 6}

# Appartenance (très rapide avec les sets)
print(3 in a)   # True`}</Code>
          </section>

          {/* ── CHAPITRE 9 ──────────────────────────────────────────────── */}
          <section id="chaines" className="space-y-5">
            <H2 id="chaines" num={9} title="Chaînes de caractères" />

            <H3>Création et bases</H3>
            <Code label="chaines.py">{`simple = 'Bonjour'
double = "Python"
multiligne = """Ligne 1
Ligne 2
Ligne 3"""

# Longueur
print(len("Python"))    # 6

# Accès par indice
s = "Python"
print(s[0])    # 'P'
print(s[-1])   # 'n'
print(s[1:4])  # 'yth'  (slicing)

# Concaténation
prenom = "Alice"
nom = "Dupont"
complet = prenom + " " + nom  # "Alice Dupont"`}</Code>

            <H3>f-strings — formatage moderne</H3>
            <P>Les f-strings (Python 3.6+) sont la méthode recommandée pour insérer des variables dans une chaîne :</P>
            <Code label="fstrings.py">{`nom = "Alice"
age = 20
note = 14.75

print(f"Bonjour, {nom} ! Tu as {age} ans.")
print(f"Ta note est {note:.1f}/20")      # 1 décimale
print(f"Le double de ton age : {age * 2}")
print(f"{'Alice':>10}")   # alignement à droite sur 10 chars`}</Code>

            <H3>Méthodes principales</H3>
            <Code label="methodes_str.py">{`s = "  Bonjour le Monde  "

# Casse
print(s.upper())        # "  BONJOUR LE MONDE  "
print(s.lower())        # "  bonjour le monde  "
print(s.title())        # "  Bonjour Le Monde  "
print(s.capitalize())   # "  bonjour le monde  " (première lettre en maj)

# Nettoyage
print(s.strip())        # "Bonjour le Monde"
print(s.lstrip())       # "Bonjour le Monde  "
print(s.rstrip())       # "  Bonjour le Monde"

# Recherche
print("Monde" in s)          # True
print(s.find("Monde"))       # indice ou -1 si absent
print(s.count("o"))          # nombre d'occurrences

# Remplacement
print(s.replace("Monde", "Python"))  # "  Bonjour le Python  "

# Test
print("123".isdigit())       # True
print("abc".isalpha())       # True
print("abc123".isalnum())    # True
print("   ".isspace())       # True

# Découpage et assemblage
mots = "pomme,banane,cerise".split(",")
print(mots)   # ['pomme', 'banane', 'cerise']
rejoins = " - ".join(mots)
print(rejoins)  # "pomme - banane - cerise"`}</Code>

            <H3>Caractères spéciaux</H3>
            <Table
              headers={["Séquence", "Signification"]}
              rows={[
                ["\\n", "Saut de ligne"],
                ["\\t", "Tabulation horizontale"],
                ["\\\\", "Backslash littéral"],
                ['\\"', "Guillemet double"],
                ["\\'", "Apostrophe"],
              ]}
            />
            <Code label="caracteres_speciaux.py">{`print("Ligne 1\nLigne 2")    # deux lignes
print("Nom\tAge")            # colonne avec tabulation
print("C:\\Users\\Alice")     # chemin Windows

# Chaîne brute (raw string) : ignorer les séquences d'échappement
print(r"C:\Users\Alice")     # "C:\Users\Alice"  (affiché tel quel)`}</Code>
          </section>

          {/* ── CHAPITRE 10 ─────────────────────────────────────────────── */}
          <section id="fichiers" className="space-y-5">
            <H2 id="fichiers" num={10} title="Fichiers" />

            <H3>Ouvrir et lire un fichier</H3>
            <P>La fonction <C>open()</C> ouvre un fichier et retourne un objet fichier. Le bloc <C>with</C> garantit la fermeture automatique.</P>
            <Code label="lecture.py">{`# Lire tout le contenu d'un coup
with open("notes.txt", "r", encoding="utf-8") as f:
    contenu = f.read()
    print(contenu)

# Lire ligne par ligne
with open("notes.txt", "r", encoding="utf-8") as f:
    for ligne in f:
        print(ligne.strip())   # strip() enlève le \n final

# Lire toutes les lignes dans une liste
with open("notes.txt", "r", encoding="utf-8") as f:
    lignes = f.readlines()  # retourne une liste de chaînes`}</Code>

            <H3>Écrire dans un fichier</H3>
            <Code label="ecriture.py">{`# Mode "w" : créer ou écraser le fichier
with open("resultat.txt", "w", encoding="utf-8") as f:
    f.write("Alice : 14/20\n")
    f.write("Bob : 12/20\n")

# Mode "a" : ajouter en fin de fichier (append)
with open("resultat.txt", "a", encoding="utf-8") as f:
    f.write("Charlie : 17/20\n")`}</Code>

            <H3>Modes d'ouverture</H3>
            <Table
              headers={["Mode", "Description"]}
              rows={[
                ['"r"', "Lecture seule (défaut). Erreur si le fichier n'existe pas."],
                ['"w"', "Écriture. Crée le fichier s'il n'existe pas, l'écrase sinon."],
                ['"a"', "Ajout en fin de fichier. Crée le fichier s'il n'existe pas."],
                ['"x"', "Création exclusive. Erreur si le fichier existe déjà."],
                ['"rb"', "Lecture en mode binaire (images, PDF...)."],
                ['"wb"', "Écriture en mode binaire."],
              ]}
            />
            <Warn>Spécifiez toujours <C>encoding="utf-8"</C> pour les fichiers texte, afin d'éviter des problèmes avec les caractères accentués.</Warn>

            <H3>Vérifier l'existence d'un fichier</H3>
            <Code label="os_path.py">{`import os

if os.path.exists("notes.txt"):
    print("Le fichier existe")
else:
    print("Le fichier n'existe pas")`}</Code>
          </section>

          {/* ── CHAPITRE 11 ─────────────────────────────────────────────── */}
          <section id="exceptions" className="space-y-5">
            <H2 id="exceptions" num={11} title="Gestion des erreurs" />

            <H3>Les exceptions en Python</H3>
            <P>Une exception est une erreur détectée à l'exécution. Sans gestion, elle interrompt le programme. Avec <C>try/except</C>, on peut l'intercepter et réagir.</P>
            <Code label="try_except.py">{`try:
    nombre = int(input("Entrez un nombre : "))
    print(f"Le carré est {nombre ** 2}")
except ValueError:
    print("Ce n'est pas un nombre valide !")

# Sortie si l'utilisateur tape "abc" :
# Ce n'est pas un nombre valide !`}</Code>

            <H3>Exceptions multiples</H3>
            <Code label="multi_except.py">{`try:
    x = int(input("Numérateur : "))
    y = int(input("Dénominateur : "))
    print(x / y)
except ValueError:
    print("Veuillez entrer des entiers.")
except ZeroDivisionError:
    print("Division par zéro impossible.")`}</Code>

            <H3>Les blocs else et finally</H3>
            <Code label="else_finally.py">{`try:
    f = open("data.txt", "r")
    contenu = f.read()
except FileNotFoundError:
    print("Fichier introuvable.")
else:
    # S'exécute uniquement si aucune exception n'a été levée
    print(f"Fichier lu : {len(contenu)} caractères")
    f.close()
finally:
    # S'exécute TOUJOURS, qu'il y ait eu une exception ou non
    print("Traitement terminé.")`}</Code>

            <H3>Exceptions fréquentes</H3>
            <Table
              headers={["Exception", "Cause"]}
              rows={[
                ["ValueError", "Valeur incorrecte pour le type (ex : int(\"abc\"))"],
                ["TypeError", "Type incorrect pour une opération (ex : 1 + \"a\")"],
                ["IndexError", "Indice hors limites d'une liste ou d'une chaîne"],
                ["KeyError", "Clé absente dans un dictionnaire"],
                ["ZeroDivisionError", "Division ou modulo par zéro"],
                ["FileNotFoundError", "Fichier introuvable à l'ouverture"],
                ["AttributeError", "Attribut ou méthode inexistant sur un objet"],
                ["NameError", "Variable non définie utilisée"],
                ["RecursionError", "Profondeur de récursion dépassée"],
              ]}
            />

            <H3>Lever une exception avec raise</H3>
            <Code label="raise.py">{`def diviser(a, b):
    if b == 0:
        raise ValueError("Le dénominateur ne peut pas être zéro.")
    return a / b

try:
    print(diviser(10, 0))
except ValueError as e:
    print(f"Erreur : {e}")`}</Code>

            <Tip>Attrapez toujours l'exception la plus précise possible. Évitez <C>except Exception:</C> (ou pire, <C>except:</C>) qui masque les bugs involontaires.</Tip>
          </section>

          {/* ── CHAPITRE 12 ─────────────────────────────────────────────── */}
          <section id="modules" className="space-y-5">
            <H2 id="modules" num={12} title="Modules et bibliothèques" />

            <H3>Importer un module</H3>
            <Code label="import.py">{`# Importer tout le module
import math
print(math.pi)           # 3.141592653589793
print(math.sqrt(16))     # 4.0
print(math.floor(3.9))   # 3
print(math.ceil(3.1))    # 4

# Importer uniquement certains éléments
from math import pi, sqrt
print(pi)
print(sqrt(25))   # 5.0

# Importer avec un alias
import math as m
print(m.cos(0))   # 1.0`}</Code>

            <H3>Module random</H3>
            <Code label="random.py">{`import random

# Nombre flottant entre 0 et 1
print(random.random())

# Entier entre a et b (inclus)
print(random.randint(1, 6))  # simuler un dé

# Choisir au hasard dans une liste
couleurs = ["rouge", "vert", "bleu"]
print(random.choice(couleurs))

# Mélanger une liste (en place)
cartes = list(range(1, 53))
random.shuffle(cartes)

# Échantillon de k éléments sans remise
tirage = random.sample(range(1, 50), 6)  # euromillions basique`}</Code>

            <H3>Module datetime</H3>
            <Code label="datetime.py">{`from datetime import datetime, date, timedelta

maintenant = datetime.now()
print(maintenant)                          # 2025-05-25 14:30:00.123456
print(maintenant.strftime("%d/%m/%Y"))    # 25/05/2025
print(maintenant.strftime("%H:%M"))       # 14:30

aujourd_hui = date.today()
dans_une_semaine = aujourd_hui + timedelta(days=7)
print(dans_une_semaine)`}</Code>

            <H3>Module os</H3>
            <Code label="os.py">{`import os

print(os.getcwd())            # répertoire courant
os.mkdir("nouveau_dossier")   # créer un dossier
print(os.listdir("."))        # contenu du répertoire courant
os.remove("fichier.txt")      # supprimer un fichier
print(os.path.join("dossier", "fichier.txt"))  # chemin compatible OS`}</Code>

            <H3>Module sys</H3>
            <Code label="sys.py">{`import sys

print(sys.version)        # version de Python
print(sys.argv)           # arguments de la ligne de commande
sys.exit(0)               # quitter le programme avec un code de retour`}</Code>

            <H3>Installer des bibliothèques externes avec pip</H3>
            <Code label="pip.sh">{`# Dans le terminal
pip install requests       # bibliothèque HTTP
pip install numpy          # calcul numérique
pip install pandas         # analyse de données
pip install matplotlib     # visualisation

pip list                   # lister les paquets installés
pip show requests          # infos sur un paquet
pip install --upgrade pip  # mettre à jour pip lui-même`}</Code>

            <Note>
              Il est recommandé de travailler dans un <strong>environnement virtuel</strong> pour isoler les dépendances de chaque projet :{" "}
              <C>python -m venv venv</C> puis <C>source venv/bin/activate</C> (Linux/Mac) ou <C>venv\Scripts\activate</C> (Windows).
            </Note>
          </section>

          {/* ── CHAPITRE 13 ─────────────────────────────────────────────── */}
          <section id="poo" className="space-y-5">
            <H2 id="poo" num={13} title="Programmation orientée objet" />

            <H3>Concepts de base</H3>
            <P>
              La <strong>Programmation Orientée Objet</strong> (POO) organise le code autour d'<strong>objets</strong>
              qui regroupent des <strong>données</strong> (attributs) et des <strong>comportements</strong> (méthodes).
              Une <strong>classe</strong> est le modèle ; un <strong>objet</strong> est une instance concrète de ce modèle.
            </P>

            <H3>Définir une classe</H3>
            <Code label="classe.py">{`class Etudiant:
    # Méthode spéciale appelée à la création d'un objet
    def __init__(self, nom, numero):
        self.nom = nom          # attribut d'instance
        self.numero = numero
        self.notes = []         # attribut initialisé vide

    def ajouter_note(self, note):
        self.notes.append(note)

    def moyenne(self):
        if not self.notes:
            return None
        return sum(self.notes) / len(self.notes)

    def __str__(self):
        moy = self.moyenne()
        if moy is not None:
            return f"{self.nom} ({self.numero}) — Moy. : {moy:.1f}"
        return f"{self.nom} ({self.numero}) — Aucune note"


# Créer des objets (instances)
alice = Etudiant("Alice Dupont", "E2024001")
bob   = Etudiant("Bob Martin",   "E2024002")

alice.ajouter_note(14)
alice.ajouter_note(16)
alice.ajouter_note(12)

print(alice)          # Alice Dupont (E2024001) — Moy. : 14.0
print(alice.moyenne())  # 14.0
print(alice.nom)        # "Alice Dupont"`}</Code>

            <H3>Héritage</H3>
            <P>Une classe peut <strong>hériter</strong> d'une autre classe et réutiliser ses attributs et méthodes, tout en les spécialisant.</P>
            <Code label="heritage.py">{`class Personne:
    def __init__(self, nom, age):
        self.nom = nom
        self.age = age

    def se_presenter(self):
        return f"Je m'appelle {self.nom}, j'ai {self.age} ans."


class Etudiant(Personne):
    def __init__(self, nom, age, numero):
        super().__init__(nom, age)  # appel du constructeur parent
        self.numero = numero

    def se_presenter(self):  # surcharge de la méthode
        base = super().se_presenter()
        return f"{base} Numéro étudiant : {self.numero}."


class Professeur(Personne):
    def __init__(self, nom, age, matiere):
        super().__init__(nom, age)
        self.matiere = matiere

    def se_presenter(self):
        base = super().se_presenter()
        return f"{base} J'enseigne {self.matiere}."


e = Etudiant("Alice", 20, "E2024001")
p = Professeur("M. Martin", 45, "Python")

print(e.se_presenter())
print(p.se_presenter())`}</Code>

            <H3>Méthodes spéciales (dunder methods)</H3>
            <Code label="dunder.py">{`class Vecteur:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):          # str(v) et print(v)
        return f"Vecteur({self.x}, {self.y})"

    def __repr__(self):         # représentation technique
        return f"Vecteur(x={self.x}, y={self.y})"

    def __len__(self):          # len(v)
        return 2

    def __add__(self, other):   # v1 + v2
        return Vecteur(self.x + other.x, self.y + other.y)

    def __eq__(self, other):    # v1 == v2
        return self.x == other.x and self.y == other.y


v1 = Vecteur(1, 2)
v2 = Vecteur(3, 4)
print(v1)           # Vecteur(1, 2)
print(v1 + v2)      # Vecteur(4, 6)
print(len(v1))      # 2
print(v1 == v2)     # False`}</Code>

            <Note>
              En Python, tout est objet : les entiers, les chaînes, les listes, les fonctions.
              Comprendre les classes vous permet de mieux comprendre pourquoi <C>"bonjour".upper()</C>,
              <C>[1,2,3].append(4)</C> ou <C>len("abc")</C> fonctionnent comme ils le font.
            </Note>

            <H3>Attributs de classe</H3>
            <Code label="attributs_classe.py">{`class Compteur:
    total = 0   # attribut de CLASSE, partagé par toutes les instances

    def __init__(self, nom):
        self.nom = nom       # attribut d'INSTANCE, propre à chaque objet
        Compteur.total += 1

c1 = Compteur("alpha")
c2 = Compteur("beta")
c3 = Compteur("gamma")

print(Compteur.total)   # 3
print(c1.total)         # 3  (accessible depuis l'instance aussi)
print(c1.nom)           # "alpha"  (propre à c1)`}</Code>
          </section>

          {/* ── Récapitulatif ───────────────────────────────────────────── */}
          <section className="space-y-5">
            <div className="bg-gradient-to-br from-brand-50 to-violet-50 dark:from-brand-950/50 dark:to-violet-950/40 border border-brand-200 dark:border-brand-800 rounded-2xl p-6">
              <h2 className="text-lg font-extrabold text-brand-800 dark:text-brand-200 mb-4">
                Récapitulatif des concepts essentiels
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ["Variables et types", "int, float, str, bool, None — typage dynamique"],
                  ["Opérateurs", "Arithm. (+,−,*,/,//,%,**) · Comp. (==,!=,<,>) · Log. (and,or,not)"],
                  ["Conditions", "if / elif / else · opérateur ternaire"],
                  ["Boucles", "for...in · while · break · continue · range()"],
                  ["Fonctions", "def · return · paramètres par défaut · *args · lambda"],
                  ["Collections", "list · tuple · dict · set · compréhensions"],
                  ["Chaînes", "f-strings · .upper/lower/strip/split/join/replace"],
                  ["Fichiers", "open() · with ... as · modes r/w/a"],
                  ["Exceptions", "try/except/else/finally · raise"],
                  ["Modules", "import · from ... import · math · random · datetime · os"],
                  ["POO", "class · __init__ · self · héritage · super() · dunder"],
                ].map(([titre, desc]) => (
                  <div key={titre} className="flex gap-3 items-start bg-white dark:bg-gray-900/50 rounded-xl p-3 border border-brand-100 dark:border-brand-900">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
                    <div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{titre}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Footer nav ──────────────────────────────────────────────── */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-center print:hidden">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au tableau de bord
            </Link>
          </div>

        </main>
      </div>
    </div>
  );
}
