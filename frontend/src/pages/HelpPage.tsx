import { Link } from "react-router-dom";

// ── Layout helpers ────────────────────────────────────────────────────────────

const Section = ({ id, title, emoji, children }: { id: string; title: string; emoji: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-24 space-y-8">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white pb-3 border-b-2 border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
      <span>{emoji}</span> {title}
    </h2>
    {children}
  </section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-base font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">{title}</h3>
    {children}
  </div>
);

const Steps = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="space-y-3">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3 items-start text-sm text-gray-700 dark:text-gray-300">
        <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
        <span>{item}</span>
      </li>
    ))}
  </ol>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 px-4 py-3 text-amber-800 dark:text-amber-300 text-sm rounded-r-lg flex gap-2">
    <span className="shrink-0">💡</span><span>{children}</span>
  </div>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 px-4 py-3 text-green-800 dark:text-green-300 text-sm rounded-r-lg flex gap-2">
    <span className="shrink-0">✅</span><span>{children}</span>
  </div>
);

// ── UI Mockup components ──────────────────────────────────────────────────────

const Screen = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden shadow-lg bg-white dark:bg-gray-900 print:shadow-none">
    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 mx-auto font-mono">pyexam.digitalmatis.com — {title}</span>
    </div>
    <div className="p-4 text-sm">{children}</div>
  </div>
);

const Annotation = ({ text, children }: { text: string; children: React.ReactNode }) => (
  <div className="relative group">
    {children}
    <div className="absolute -right-2 -top-2 z-10">
      <div className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center cursor-help shadow-md" title={text}>!</div>
    </div>
    <div className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">↑ {text}</div>
  </div>
);

const FakeInput = ({ label, value, hint }: { label: string; value?: string; hint?: string }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</label>
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs min-h-[34px]">
      {value ? <span>{value}</span> : <span className="text-gray-400">{hint}</span>}
    </div>
  </div>
);

const FakeBtn = ({ children, color = "indigo" }: { children: React.ReactNode; color?: string }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${color === "green" ? "bg-green-600" : color === "red" ? "bg-red-600" : color === "gray" ? "bg-gray-500" : "bg-indigo-600"}`}>
    {children}
  </span>
);

const FakeBadge = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${color}`}>{children}</span>
);

// ── CSV Download Button ───────────────────────────────────────────────────────

const CSVDownload = ({ file, label, description, columns }: { file: string; label: string; description: string; columns: { name: string; required: boolean; desc: string }[] }) => (
  <div className="border border-indigo-200 dark:border-indigo-700 rounded-xl overflow-hidden">
    <div className="bg-indigo-50 dark:bg-indigo-900/30 px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <p className="font-semibold text-indigo-700 dark:text-indigo-300 text-sm mb-1">📄 {label}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <a
        href={file}
        download
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
      >
        ⬇ Télécharger le modèle (.csv)
      </a>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
            <th className="px-4 py-2 text-left font-semibold text-gray-500">Colonne</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-500">Obligatoire</th>
            <th className="px-4 py-2 text-left font-semibold text-gray-500">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {columns.map((col) => (
            <tr key={col.name} className="bg-white dark:bg-gray-900">
              <td className="px-4 py-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{col.name}</td>
              <td className="px-4 py-2">
                {col.required
                  ? <FakeBadge color="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Requis</FakeBadge>
                  : <FakeBadge color="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Optionnel</FakeBadge>}
              </td>
              <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{col.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Exemple de contenu :</p>
      <pre className="font-mono text-[10px] text-gray-700 dark:text-gray-300 overflow-x-auto">
        {columns.map(c => c.name).join(",")}{"\n"}
        Fatou Diop,fatou.diop@etudiant.fr,E2024001,L3INFO,{"\n"}
        Moussa Traoré,moussa@etudiant.fr,E2024002,L3INFO,motdepasse123
      </pre>
    </div>
  </div>
);

// ── TOC ───────────────────────────────────────────────────────────────────────

const toc = [
  { id: "intro",    label: "Présentation" },
  { id: "admin",    label: "Administrateur / Professeur" },
  { id: "csv",      label: "Import CSV" },
  { id: "student",  label: "Étudiant / Candidat" },
  { id: "workflow", label: "Workflow complet" },
  { id: "faq",      label: "FAQ" },
];

// ── PAGE ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-indigo-600 dark:from-indigo-900 dark:to-indigo-800 text-white py-12 px-4 print:py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">📘</span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Documentation PyExam</h1>
              <p className="text-indigo-200 text-sm mt-1">Guide complet — Administrateurs · Professeurs · Étudiants</p>
            </div>
          </div>
          <div className="mt-5 flex gap-3 text-sm print:hidden flex-wrap">
            <Link to="/login" className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 transition">
              ← Retour à la connexion
            </Link>
            <button onClick={() => window.print()} className="border border-white/40 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition">
              🖨 Imprimer / Exporter PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 flex gap-10">

        {/* TOC sidebar */}
        <aside className="hidden lg:block w-52 shrink-0 print:hidden">
          <div className="sticky top-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Sommaire</p>
            <nav className="space-y-0.5">
              {toc.map((item) => (
                <a key={item.id} href={`#${item.id}`}
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 px-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-16">

          {/* ── PRÉSENTATION ──────────────────────────────────────────── */}
          <Section id="intro" title="Présentation de PyExam" emoji="🎯">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <strong>PyExam</strong> est une plateforme d'examens en ligne pour organiser des évaluations
              avec des <strong>QCM</strong> et des <strong>exercices de code Python</strong>.
              Les professeurs créent les examens, les étudiants les passent dans le navigateur,
              et les corrections sont automatiques.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: "🛠", title: "Administrateur", color: "border-indigo-300 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-700", items: ["Créer et gérer les examens", "Ajouter les questions (QCM + Code)", "Importer les étudiants", "Consulter les rapports & exports"] },
                { icon: "🎓", title: "Étudiant", color: "border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700", items: ["Passer les examens en ligne", "Écrire du code Python", "Tester son code avant soumission", "Recevoir ses résultats par email"] },
                { icon: "🤖", title: "Système", color: "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600", items: ["Exécution Python via Piston", "Correction automatique", "Envoi des emails de résultats", "Détection de triche (onglets)"] },
              ].map((c) => (
                <div key={c.title} className={`rounded-xl border-2 p-4 ${c.color}`}>
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <p className="font-bold text-sm mb-2">{c.title}</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {c.items.map((i) => <li key={i} className="flex gap-1.5"><span className="text-indigo-400">·</span>{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* ── ADMIN ─────────────────────────────────────────────────── */}
          <Section id="admin" title="Administrateur / Professeur" emoji="🛠">

            {/* Créer un examen */}
            <SubSection title="1 · Créer un examen">
              <Steps items={[
                <>Cliquez sur <strong>+ Nouvel examen</strong> depuis le tableau de bord admin.</>,
                <>Renseignez le titre, la durée, les dates et les paramètres de notation.</>,
                <>Ajoutez vos questions puis cliquez <strong>Enregistrer</strong>.</>,
              ]} />
              <Screen title="Admin — Création d'examen">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Annotation text="Titre affiché aux étudiants">
                      <FakeInput label="Titre de l'examen *" value="Algorithmique — Session 1" />
                    </Annotation>
                    <Annotation text="En minutes — chrono visible par l'étudiant">
                      <FakeInput label="Durée (minutes) *" value="90" />
                    </Annotation>
                    <Annotation text="Les étudiants ne peuvent démarrer qu'après cette heure">
                      <FakeInput label="Début" value="2026-06-10  09:00" />
                    </Annotation>
                    <Annotation text="Soumission automatique à la fin de cette fenêtre">
                      <FakeInput label="Fin" value="2026-06-10  11:30" />
                    </Annotation>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Notation (optionnel)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Annotation text="Score brut converti sur cette valeur (ex: 20)">
                        <FakeInput label="Noté sur" hint="ex: 20 (laisser vide = points bruts)" />
                      </Annotation>
                      <Annotation text="% minimum pour être Admis (défaut: 50%)">
                        <FakeInput label="Seuil d'admission (%)" hint="ex: 50" />
                      </Annotation>
                    </div>
                  </div>
                  <div>
                    <Annotation text="Restreindre à certaines classes (séparé par virgules)">
                      <FakeInput label="Groupes autorisés" hint="ex: L3INFO, M1MATH (vide = tous)" />
                    </Annotation>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <FakeBtn>💾 Enregistrer</FakeBtn>
                    <FakeBtn color="gray">Annuler</FakeBtn>
                  </div>
                </div>
              </Screen>
            </SubSection>

            {/* Questions */}
            <SubSection title="2 · Ajouter des questions">
              <Note>
                Chaque examen peut mélanger des QCM et des exercices de code Python.
                Les deux types sont corrigés automatiquement.
              </Note>

              {/* QCM */}
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Question QCM</p>
              <Screen title="Admin — Éditeur de question QCM">
                <div className="space-y-2">
                  <Annotation text="Posez la question clairement">
                    <FakeInput label="Énoncé *" value="Quelle est la complexité temporelle d'une recherche binaire ?" />
                  </Annotation>
                  <Annotation text="Points attribués si la bonne réponse est choisie">
                    <FakeInput label="Points *" value="2" />
                  </Annotation>
                  <div className="space-y-1.5 mt-2">
                    <p className="text-xs font-semibold text-gray-500">Options de réponse</p>
                    {[
                      { label: "A", text: "O(n)", correct: false },
                      { label: "B", text: "O(log n)", correct: true },
                      { label: "C", text: "O(n²)", correct: false },
                      { label: "D", text: "O(1)", correct: false },
                    ].map((opt) => (
                      <div key={opt.label} className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs ${opt.correct ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700"}`}>
                        <span className="font-bold text-gray-500 w-5">{opt.label}</span>
                        <span className={`flex-1 ${opt.correct ? "font-semibold text-green-700 dark:text-green-400" : ""}`}>{opt.text}</span>
                        {opt.correct && <FakeBadge color="bg-green-100 text-green-700">✓ Bonne réponse</FakeBadge>}
                      </div>
                    ))}
                  </div>
                </div>
              </Screen>

              {/* Code */}
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4">Exercice de code Python</p>
              <Screen title="Admin — Éditeur de question Code">
                <div className="space-y-3">
                  <Annotation text="Décrivez précisément ce que le code doit faire">
                    <FakeInput label="Énoncé *" value="Lisez un entier positif N et affichez la somme de ses chiffres." />
                  </Annotation>
                  <FakeInput label="Points *" value="3" />
                  <div className="border-t pt-3 border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cas de test</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 font-semibold mb-1 px-1">
                      <span>Entrée (stdin)</span>
                      <span>Sortie attendue</span>
                      <span>Poids</span>
                    </div>
                    {[
                      { input: "123", output: "6", weight: "1", note: "1+2+3 = 6" },
                      { input: "9999", output: "36", weight: "1", note: "9+9+9+9 = 36" },
                      { input: "10", output: "1", weight: "1", note: "1+0 = 1" },
                    ].map((tc, i) => (
                      <div key={i} className="relative">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 font-mono bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">{tc.input}</div>
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 font-mono bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">{tc.output}</div>
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 font-mono bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">{tc.weight}</div>
                        </div>
                        <p className="text-[10px] text-indigo-500 -mt-1 mb-1 ml-1">← {tc.note}</p>
                      </div>
                    ))}
                    <button className="text-xs text-indigo-600 hover:underline mt-1">+ Ajouter un cas de test</button>
                  </div>
                </div>
              </Screen>
              <Note>
                La <strong>Sortie attendue</strong> doit correspondre exactement au dernier <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">print()</code> de l'étudiant.
                Les messages des <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">input("prompt")</code> sont automatiquement ignorés.
              </Note>
            </SubSection>

            {/* Activer + corriger */}
            <SubSection title="3 · Activer, clôturer et corriger">
              <Screen title="Admin — Tableau de bord">
                <div className="space-y-2">
                  {[
                    { title: "Algorithmique — Session 1", status: "active", students: 24, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", actions: ["Clôturer"] },
                    { title: "Python Fondamentaux", status: "closed", students: 18, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", actions: ["Corriger"] },
                    { title: "Test 4 — Structures de données", status: "corrected", students: 20, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", actions: ["Rapport", "Statistiques"] },
                    { title: "Examen Final — Brouillon", status: "draft", students: 0, color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300", actions: ["Activer", "Éditer"] },
                  ].map((exam) => (
                    <div key={exam.title} className="flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-800 rounded-lg px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{exam.title}</p>
                        <p className="text-[10px] text-gray-400">{exam.students} étudiants</p>
                      </div>
                      <FakeBadge color={exam.color}>{exam.status}</FakeBadge>
                      <div className="flex gap-1.5">
                        {exam.actions.map((a) => (
                          <FakeBtn key={a} color={a === "Corriger" ? "green" : a === "Rapport" ? "indigo" : "gray"}>{a}</FakeBtn>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Screen>
              <Tip>
                Une fois la correction lancée, chaque étudiant reçoit automatiquement son email de résultats.
                Il n'y a rien d'autre à faire.
              </Tip>
            </SubSection>

            {/* Rapport */}
            <SubSection title="4 · Rapport et exports">
              <Screen title="Admin — Rapport d'examen">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[11px]">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        {["N° étudiant", "Nom", "Score", "Note /20", "Résultat", "Onglets"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {[
                        { num: "E2024001", name: "Fatou Diop", score: "3,0 / 3,0", grade: "20,00 / 20", result: "Admis", tabs: 0, pass: true },
                        { num: "E2024002", name: "Moussa Traoré", score: "2,0 / 3,0", grade: "13,33 / 20", result: "Admis", tabs: 1, pass: true },
                        { num: "E2024003", name: "Aminata Coulibaly", score: "1,0 / 3,0", grade: "6,67 / 20", result: "Refusé", tabs: 0, pass: false },
                        { num: "E2024004", name: "Ibrahima Sow", score: "2,5 / 3,0", grade: "16,67 / 20", result: "Admis", tabs: 4, pass: true },
                      ].map((r) => (
                        <tr key={r.num} className="bg-white dark:bg-gray-900">
                          <td className="px-3 py-2 font-mono text-gray-500">{r.num}</td>
                          <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{r.name}</td>
                          <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">{r.score}</td>
                          <td className="px-3 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.grade}</td>
                          <td className="px-3 py-2">
                            <FakeBadge color={r.pass ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}>
                              {r.result}
                            </FakeBadge>
                          </td>
                          <td className={`px-3 py-2 text-center font-bold ${r.tabs > 3 ? "text-red-600" : "text-gray-600"}`}>{r.tabs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <FakeBtn color="gray">⬇ Exporter CSV</FakeBtn>
                  <FakeBtn color="red">⬇ Exporter PDF</FakeBtn>
                </div>
              </Screen>
              <Note>
                Les <strong>changements d'onglet en rouge</strong> (≥ 4) signalent un comportement suspect.
                À l'appréciation du professeur.
              </Note>
            </SubSection>
          </Section>

          {/* ── CSV IMPORT ────────────────────────────────────────────── */}
          <Section id="csv" title="Import CSV des étudiants" emoji="📂">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              L'import CSV permet de créer plusieurs comptes étudiants en une seule opération.
              Téléchargez le modèle, remplissez-le avec vos données, puis importez-le depuis
              <strong> Admin → Utilisateurs → Importer CSV</strong>.
            </p>

            <CSVDownload
              file="/templates/import_etudiants.csv"
              label="Modèle — Import d'étudiants"
              description="Créez autant de lignes que d'étudiants. Encodage UTF-8 ou Excel (BOM) accepté."
              columns={[
                { name: "full_name", required: true, desc: "Nom complet de l'étudiant (prénom + nom)" },
                { name: "email", required: true, desc: "Adresse email — sera utilisée pour la connexion et les résultats" },
                { name: "student_number", required: false, desc: "Numéro matricule ou étudiant — affiché dans les rapports" },
                { name: "class_name", required: false, desc: "Nom de la classe ou du groupe (ex: L3INFO). Doit correspondre aux groupes autorisés des examens" },
                { name: "password", required: false, desc: "Mot de passe (min 8 chars). Si vide : généré automatiquement et affiché après import" },
              ]}
            />

            <SubSection title="Étapes d'importation">
              <Steps items={[
                <>Allez dans <strong>Admin → Utilisateurs</strong>.</>,
                <>Cliquez sur <strong>Importer CSV</strong> et sélectionnez votre fichier.</>,
                <>Le système affiche un résumé : comptes créés, ignorés (email déjà existant), erreurs.</>,
                <>Si aucun mot de passe n'était fourni, les mots de passe générés automatiquement sont affichés à cet écran uniquement — notez-les ou transmettez-les aux étudiants.</>,
              ]} />

              <Screen title="Admin — Résultat d'importation CSV">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3">
                      <p className="text-2xl font-bold text-green-600">18</p>
                      <p className="text-xs text-green-700 dark:text-green-400">Créés</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
                      <p className="text-2xl font-bold text-amber-600">2</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Ignorés (email existant)</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3">
                      <p className="text-2xl font-bold text-red-600">0</p>
                      <p className="text-xs text-red-700 dark:text-red-400">Erreurs</p>
                    </div>
                  </div>
                  <div className="border border-amber-200 dark:border-amber-700 rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">⚠ Mots de passe générés automatiquement — notez-les maintenant</p>
                    <table className="text-[11px] w-full">
                      <thead><tr className="text-gray-500"><th className="text-left pb-1">Email</th><th className="text-left pb-1">Mot de passe</th></tr></thead>
                      <tbody>
                        <tr><td className="font-mono">fatou.diop@etudiant.fr</td><td className="font-mono font-bold">Kx9mP2qWnL</td></tr>
                        <tr><td className="font-mono">ibrahima.sow@etudiant.fr</td><td className="font-mono font-bold">Tz4nR8vYjQ</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Screen>
              <Note>
                Les mots de passe générés ne sont affichés <strong>qu'une seule fois</strong> après l'import.
                Si vous les perdez, utilisez la fonction "Réinitialiser le mot de passe" depuis la page Utilisateurs.
              </Note>
            </SubSection>
          </Section>

          {/* ── ÉTUDIANT ──────────────────────────────────────────────── */}
          <Section id="student" title="Étudiant / Candidat" emoji="🎓">

            <SubSection title="1 · Inscription et vérification">
              <Steps items={[
                <>Allez sur <strong>/register</strong> et remplissez le formulaire.</>,
                <>Un code à 6 chiffres vous est envoyé par email.</>,
                <>Saisissez ce code pour activer votre compte.</>,
              ]} />
              <Screen title="Inscription — Vérification par email">
                <div className="max-w-sm mx-auto space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mx-auto text-2xl">📧</div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Vérifiez votre adresse e-mail</p>
                  <p className="text-xs text-gray-500">Un code a été envoyé à <strong>fatou.diop@etudiant.fr</strong></p>
                  <Annotation text="Code reçu par email — valable 15 minutes">
                    <div className="flex gap-2 justify-center">
                      {["4", "7", "3", "9", "1", "2"].map((d, i) => (
                        <div key={i} className="w-10 h-12 border-2 border-indigo-400 rounded-lg flex items-center justify-center text-xl font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900">
                          {d}
                        </div>
                      ))}
                    </div>
                  </Annotation>
                  <FakeBtn>Vérifier mon compte</FakeBtn>
                </div>
              </Screen>
            </SubSection>

            <SubSection title="2 · Passer un examen">
              <Screen title="Examen — Interface de passage">
                <div className="flex gap-3">
                  {/* Nav */}
                  <div className="shrink-0 w-24 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Questions</p>
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs cursor-pointer ${n === 3 ? "bg-indigo-600 text-white font-bold" : n <= 2 ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                        {n <= 2 ? "✓" : ""} Q{n}
                      </div>
                    ))}
                  </div>
                  {/* Question */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <FakeBadge color="bg-green-100 text-green-700">Code Python</FakeBadge>
                      <Annotation text="Temps restant — décompte automatique">
                        <FakeBadge color="bg-amber-100 text-amber-700">⏱ 01:12:44</FakeBadge>
                      </Annotation>
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Lisez un entier N et affichez sa table de multiplication de 1 à 10.<br/>
                      <span className="text-gray-400">Format : <code>N x K = R</code></span>
                    </p>
                    <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-300 space-y-0.5">
                      <p className="text-gray-500"># Votre code Python</p>
                      <p>N = <span className="text-yellow-300">int</span>(<span className="text-yellow-300">input</span>())</p>
                      <p><span className="text-purple-400">for</span> k <span className="text-purple-400">in</span> <span className="text-yellow-300">range</span>(1, 11):</p>
                      <p className="ml-4"><span className="text-yellow-300">print</span>(f<span className="text-orange-300">"{"{"}N{"}"} x {"{"}k{"}"} = {"{"}N*k{"}"}"</span>)</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <FakeBtn color="green">▶ Exécuter</FakeBtn>
                      <span className="text-[10px] text-green-500 font-medium">✓ Sauvegardé</span>
                    </div>
                  </div>
                </div>
              </Screen>
              <Tip>
                Le code est <strong>sauvegardé automatiquement</strong> à chaque frappe. Même si la connexion est perdue momentanément, le code ne sera pas perdu.
              </Tip>
            </SubSection>

            <SubSection title="3 · Résultats après correction">
              <Screen title="Mes résultats — Algorithmique Session 1">
                <div className="space-y-3">
                  <div className="rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Score total</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">3,0 / 3,0</p>
                        <Annotation text="Note calculée sur le barème configuré par le prof">
                          <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">20,00 / 20</p>
                        </Annotation>
                      </div>
                      <FakeBadge color="bg-green-500 text-white text-sm px-4 py-2 rounded-full font-bold">Admis</FakeBadge>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Seuil d'admission : 50%</p>
                  </div>
                  {[
                    { q: "Q1. Complexité temporelle d'une recherche binaire ?", type: "QCM", score: "2,0 / 2,0", fb: "Correct.", pass: true },
                    { q: "Q2. Lisez N et affichez sa table de multiplication...", type: "Code", score: "1,0 / 1,0", fb: "Test 1: ✓  Test 2: ✓", pass: true },
                  ].map((q, i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between gap-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1">{q.q}</p>
                        <FakeBadge color={q.pass ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700"}>{q.score}</FakeBadge>
                      </div>
                      <p className="text-[11px] text-gray-500">{q.fb}</p>
                    </div>
                  ))}
                </div>
              </Screen>
            </SubSection>
          </Section>

          {/* ── WORKFLOW ──────────────────────────────────────────────── */}
          <Section id="workflow" title="Workflow complet" emoji="🔄">
            <div className="relative pl-8 space-y-0">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-indigo-200 dark:bg-indigo-800" />
              {[
                { icon: "📝", actor: "Professeur", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", step: "Crée l'examen : titre, durée, dates, barème, seuil, groupes." },
                { icon: "➕", actor: "Professeur", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", step: "Ajoute les questions (QCM et/ou Code avec cas de test)." },
                { icon: "👥", actor: "Professeur", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", step: "Importe ou crée les étudiants (CSV ou saisie manuelle)." },
                { icon: "▶️", actor: "Professeur", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", step: "Active l'examen — les étudiants peuvent maintenant y accéder." },
                { icon: "💻", actor: "Étudiant", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", step: "Se connecte, démarre l'examen, répond, soumet." },
                { icon: "⏱", actor: "Système", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", step: "Clôture automatique à la fin de la fenêtre horaire." },
                { icon: "🤖", actor: "Professeur", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", step: "Lance la correction automatique depuis le tableau de bord." },
                { icon: "📧", actor: "Système", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", step: "Envoie un email de résultats à chaque étudiant." },
                { icon: "📊", actor: "Professeur", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", step: "Consulte le rapport, exporte en PDF/CSV." },
              ].map((s, i) => (
                <div key={i} className="flex gap-4 pb-5 relative">
                  <div className="absolute -left-5 top-1 w-6 h-6 rounded-full bg-white dark:bg-gray-950 border-2 border-indigo-400 flex items-center justify-center text-sm z-10">{s.icon}</div>
                  <div className="flex gap-2 items-baseline flex-wrap">
                    <FakeBadge color={s.color}>{s.actor}</FakeBadge>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{s.step}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── FAQ ───────────────────────────────────────────────────── */}
          <Section id="faq" title="Questions fréquentes" emoji="❓">
            {[
              { q: "Un étudiant n'a pas reçu l'email de résultats", a: "Vérifiez les spams. L'email part automatiquement après correction. Si absent, relancez la correction depuis le tableau de bord admin." },
              { q: "Le code de l'étudiant est noté 0 alors qu'il fonctionne", a: "Vérifiez les cas de test : l'Entrée (stdin) doit correspondre exactement à ce que le code lit avec input(). Une entrée vide cause un EOFError → sortie vide → test échoué." },
              { q: "La sortie attendue ne correspond pas", a: "Le système compare les dernières lignes du stdout. Si le code écrit '5 x 3 = 15' mais l'attendu est '5x3=15' (sans espaces), le test échoue. Respectez le format demandé dans l'énoncé." },
              { q: "Peut-on repasser un examen ?", a: "Non. La soumission est définitive. Créez un nouvel examen pour une nouvelle session." },
              { q: "Que signifie un nombre élevé de changements d'onglet ?", a: "L'étudiant a navigué hors de l'onglet pendant l'examen. Visible dans le rapport. Seuil à définir selon votre politique — PyExam ne bloque pas automatiquement." },
              { q: "Quel langage de programmation est supporté ?", a: "Python 3.10 uniquement. Le code C, Java ou autres langages produiront une erreur de syntaxe." },
              { q: "Comment restreindre un examen à une classe ?", a: "Champ 'Groupes autorisés' dans la config de l'examen. Entrez le nom exact de la classe (ex: L3INFO). Les étudiants doivent avoir ce même nom dans leur champ class_name." },
              { q: "Que faire si un mot de passe généré à l'import est perdu ?", a: "Allez dans Admin → Utilisateurs, trouvez l'étudiant et utilisez 'Réinitialiser le mot de passe'. Un email de réinitialisation lui sera envoyé." },
            ].map(({ q, a }, i) => (
              <details key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition list-none">
                  <span className="flex gap-2 items-center"><span className="text-indigo-400">Q.</span>{q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-2">▾</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
                  {a}
                </div>
              </details>
            ))}
          </Section>

          <footer className="text-center text-xs text-gray-400 pb-6 border-t border-gray-200 dark:border-gray-800 pt-6">
            PyExam — Documentation v2.0 · Pour toute assistance, contactez votre administrateur.
          </footer>

        </main>
      </div>
    </div>
  );
}
