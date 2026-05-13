import { Link } from "react-router-dom";

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
      {title}
    </h2>
    <div className="space-y-5">{children}</div>
  </section>
);

const Sub = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400 mb-2">{title}</h3>
    <div className="text-gray-700 dark:text-gray-300 space-y-2 text-sm leading-relaxed">{children}</div>
  </div>
);

const Steps = ({ items }: { items: string[] }) => (
  <ol className="space-y-2 ml-2">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3">
        <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center mt-0.5">
          {i + 1}
        </span>
        <span dangerouslySetInnerHTML={{ __html: item }} />
      </li>
    ))}
  </ol>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 text-amber-800 dark:text-amber-300 text-sm flex gap-2">
    <span className="shrink-0">💡</span>
    <span>{children}</span>
  </div>
);

const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3 text-green-800 dark:text-green-300 text-sm flex gap-2">
    <span className="shrink-0">✅</span>
    <span>{children}</span>
  </div>
);

const Badge = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{children}</span>
);

const toc = [
  { id: "intro",    label: "Présentation" },
  { id: "admin",    label: "Administrateur / Professeur" },
  { id: "student",  label: "Étudiant / Candidat" },
  { id: "workflow", label: "Workflow complet" },
  { id: "faq",      label: "FAQ" },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-indigo-700 dark:bg-indigo-900 text-white py-10 px-4 print:py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📘</span>
            <h1 className="text-3xl font-extrabold tracking-tight">Documentation PyExam</h1>
          </div>
          <p className="text-indigo-200 text-base">
            Guide complet pour les administrateurs, professeurs et étudiants.
          </p>
          <div className="mt-4 flex gap-3 text-sm print:hidden">
            <Link to="/login" className="bg-white text-indigo-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-indigo-50 transition">
              ← Connexion
            </Link>
            <button onClick={() => window.print()} className="border border-indigo-300 text-indigo-100 px-4 py-1.5 rounded-lg hover:bg-indigo-600 transition">
              🖨 Imprimer
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 flex gap-10">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0 print:hidden">
          <div className="sticky top-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Sommaire</p>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 px-2 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-14">

          {/* ── PRÉSENTATION ───────────────────────────────────────────── */}
          <Section id="intro" title="Présentation de PyExam">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <strong>PyExam</strong> est une plateforme d'examens en ligne conçue pour organiser des
              évaluations avec des questions à choix multiples (QCM) et des exercices de code Python.
              Elle permet aux professeurs de créer des examens sur mesure, et aux étudiants de les passer
              directement dans le navigateur — sans installation.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              {[
                { icon: "🎓", role: "Administrateur", desc: "Crée les examens, gère les utilisateurs, consulte les rapports." },
                { icon: "📝", role: "Étudiant", desc: "Passe les examens, écrit du code Python, reçoit ses résultats par email." },
                { icon: "⚙️", role: "Technique", desc: "Exécution du code via Piston (sandbox isolée). Corrections automatiques." },
              ].map((c) => (
                <div key={c.role} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <p className="font-semibold text-sm mb-1">{c.role}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── ADMIN ─────────────────────────────────────────────────── */}
          <Section id="admin" title="🛠 Administrateur / Professeur">

            <Sub title="1. Connexion et tableau de bord">
              <Steps items={[
                "Rendez-vous sur <strong>/login</strong> et connectez-vous avec votre compte administrateur.",
                "Le tableau de bord admin affiche la liste de vos examens, leurs statuts et les actions disponibles.",
              ]} />
            </Sub>

            <Sub title="2. Créer un examen">
              <Steps items={[
                "Cliquez sur <strong>+ Nouvel examen</strong> depuis le tableau de bord admin.",
                "Renseignez le titre, la durée (en minutes), la date/heure de début et de fin.",
                "Configurez le <strong>barème</strong> (ex. noté sur 20) et le <strong>seuil d'admission</strong> (ex. 50 % = admis). Ces champs sont optionnels.",
                "Dans <strong>Groupes autorisés</strong>, entrez les noms de classe séparés par des virgules pour restreindre l'accès (laisser vide = tous les étudiants).",
                "Cliquez <strong>Enregistrer</strong>. L'examen est créé en statut <em>brouillon</em>.",
              ]} />
              <Note>
                Le champ <strong>Noté sur</strong> transforme le score brut en note sur N (ex. 3/3 pts → 20/20).
                Le champ <strong>Seuil d'admission</strong> est un pourcentage : 50 signifie que l'étudiant doit obtenir au moins 50 % pour être admis.
              </Note>
            </Sub>

            <Sub title="3. Ajouter des questions">
              <p>Chaque examen peut contenir deux types de questions :</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <div className="border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 bg-indigo-50 dark:bg-indigo-950">
                  <p className="font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                    <Badge color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">QCM</Badge>{" "}
                    Question à choix multiple
                  </p>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 list-disc ml-4">
                    <li>Saisissez l'énoncé et les 4 options (A, B, C, D).</li>
                    <li>Cochez la bonne réponse.</li>
                    <li>Définissez le nombre de points.</li>
                  </ul>
                </div>
                <div className="border border-green-200 dark:border-green-800 rounded-lg p-3 bg-green-50 dark:bg-green-950">
                  <p className="font-semibold text-green-700 dark:text-green-300 mb-1">
                    <Badge color="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Code</Badge>{" "}
                    Exercice de code Python
                  </p>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 list-disc ml-4">
                    <li>Rédigez l'énoncé (l'exercice à résoudre).</li>
                    <li>Ajoutez des <strong>cas de test</strong> : chaque test a une <em>Entrée</em> (stdin), une <em>Sortie attendue</em> et un <em>poids</em>.</li>
                    <li>Le score est proportionnel aux tests réussis.</li>
                  </ul>
                </div>
              </div>
              <Note>
                Pour les exercices de code, la <strong>Sortie attendue</strong> doit correspondre exactement
                à ce que le <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">print()</code> de l'étudiant affiche.
                Les messages des <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">input("prompt")</code> sont ignorés automatiquement.
              </Note>
            </Sub>

            <Sub title="4. Banque de questions">
              <p>
                La <strong>banque de questions</strong> (<em>menu Admin → Banque</em>) stocke des questions
                réutilisables entre plusieurs examens. Vous pouvez y importer des questions depuis un fichier
                ou en créer manuellement. Lors de la création d'un examen, sélectionnez des questions de
                la banque pour les inclure.
              </p>
            </Sub>

            <Sub title="5. Gérer les étudiants">
              <Steps items={[
                "Allez dans <strong>Admin → Utilisateurs</strong>.",
                "Créez un étudiant manuellement (nom, email, numéro étudiant, classe).",
                "Ou importez une liste via <strong>CSV</strong> : téléchargez le modèle, remplissez-le, puis importez. Les colonnes attendues : <code>full_name, email, student_number, class_name</code>.",
              ]} />
              <Tip>
                La colonne <strong>class_name</strong> permet de restreindre un examen à un groupe spécifique via le champ "Groupes autorisés".
              </Tip>
            </Sub>

            <Sub title="6. Activer et lancer un examen">
              <Steps items={[
                "Depuis le tableau de bord admin, trouvez l'examen et cliquez <strong>Activer</strong>.",
                "L'examen passe en statut <em>actif</em> : les étudiants peuvent maintenant y accéder dans la fenêtre horaire définie.",
                "À la fin, cliquez <strong>Clôturer</strong> puis <strong>Corriger</strong> pour lancer la correction automatique.",
              ]} />
              <Note>
                La correction est <strong>automatique</strong> : les QCM sont corrigés instantanément,
                les exercices de code sont exécutés et comparés aux cas de test.
                Chaque étudiant reçoit son résultat par email dès la fin de la correction.
              </Note>
            </Sub>

            <Sub title="7. Rapport d'examen">
              <p>
                Après correction, cliquez <strong>Rapport</strong> sur un examen pour voir :
              </p>
              <ul className="list-disc ml-5 text-sm space-y-1">
                <li>Score brut et note sur barème pour chaque étudiant.</li>
                <li>Statut <Badge color="bg-green-100 text-green-700">Admis</Badge> / <Badge color="bg-red-100 text-red-700">Refusé</Badge> selon le seuil configuré.</li>
                <li>Nombre de changements d'onglet (détection anti-triche).</li>
                <li>Statistiques globales : moyenne, médiane, taux de réussite, distribution.</li>
                <li>Export <strong>CSV</strong> et <strong>PDF</strong> incluant la note et le résultat.</li>
              </ul>
            </Sub>

          </Section>

          {/* ── ÉTUDIANT ──────────────────────────────────────────────── */}
          <Section id="student" title="🎓 Étudiant / Candidat">

            <Sub title="1. Créer un compte">
              <Steps items={[
                "Rendez-vous sur <strong>/register</strong> et remplissez le formulaire (nom, email, numéro étudiant, mot de passe).",
                "Un code de vérification à 6 chiffres est envoyé à votre adresse email.",
                "Saisissez ce code pour activer votre compte.",
              ]} />
              <Note>
                Si vous avez été pré-inscrit par votre professeur (import CSV), un email d'invitation vous a été envoyé avec vos identifiants.
              </Note>
            </Sub>

            <Sub title="2. Trouver et démarrer un examen">
              <Steps items={[
                "Connectez-vous sur <strong>/login</strong>.",
                "Votre tableau de bord affiche les examens disponibles (actifs et dans la fenêtre horaire).",
                "Cliquez <strong>Commencer l'examen</strong>. Un chronomètre se lance automatiquement.",
              ]} />
            </Sub>

            <Sub title="3. Répondre aux questions">
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="font-semibold text-sm mb-2">📋 Questions QCM</p>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 list-disc ml-4">
                    <li>Sélectionnez une option (A, B, C ou D).</li>
                    <li>La réponse est sauvegardée automatiquement.</li>
                    <li>Naviguez librement entre les questions.</li>
                  </ul>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="font-semibold text-sm mb-2">💻 Exercices de code</p>
                  <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 list-disc ml-4">
                    <li>Écrivez votre code Python dans l'éditeur.</li>
                    <li>Testez avec le bouton <strong>▶ Exécuter</strong> (max 10 exécutions/min).</li>
                    <li>Saisissez des valeurs dans le champ <em>Entrée (stdin)</em> si nécessaire.</li>
                    <li>Le code est sauvegardé automatiquement.</li>
                  </ul>
                </div>
              </div>
              <Tip>
                Le panneau de navigation à gauche affiche un indicateur vert pour les questions déjà répondues.
                Vous pouvez revenir sur n'importe quelle question avant de terminer.
              </Tip>
            </Sub>

            <Sub title="4. Terminer l'examen">
              <Steps items={[
                "Cliquez <strong>Terminer l'examen</strong> quand vous avez répondu à toutes les questions.",
                "Une confirmation est demandée avant la soumission définitive.",
                "Votre examen est soumis — vous ne pouvez plus modifier vos réponses.",
              ]} />
              <Note>
                Si le temps est écoulé, l'examen est soumis automatiquement avec les réponses déjà saisies.
                <strong> Ne fermez pas l'onglet</strong> pendant l'examen.
              </Note>
            </Sub>

            <Sub title="5. Recevoir ses résultats">
              <Steps items={[
                "Une fois l'examen corrigé par le professeur, vous recevez un <strong>email de résultats</strong>.",
                "L'email contient : votre note, la mention Admis/Refusé, et le détail question par question.",
                "Vous pouvez aussi consulter vos résultats et votre historique directement depuis votre tableau de bord.",
              ]} />
            </Sub>

            <Sub title="6. Écrire du code — bonnes pratiques">
              <p>Pour que votre code soit correctement évalué :</p>
              <ul className="list-disc ml-5 text-sm space-y-1">
                <li>Lisez l'entrée avec <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">input()</code> — vous pouvez utiliser un message ou non.</li>
                <li>Affichez le résultat avec <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">print()</code> en respectant le format demandé dans l'énoncé.</li>
                <li>Testez votre code avec <strong>▶ Exécuter</strong> avant de soumettre.</li>
              </ul>
              <div className="bg-gray-900 rounded-lg p-4 mt-3 font-mono text-sm text-green-300">
                <p className="text-gray-400 text-xs mb-2"># Exemple : somme des chiffres de N</p>
                <p>N = int(input())</p>
                <p>print(sum(int(c) for c in str(abs(N))))</p>
              </div>
              <Tip>
                Si l'énoncé demande d'afficher <strong>"N x K = R"</strong>, votre <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">print()</code>
                doit produire exactement ce format (espaces, majuscules, symboles).
              </Tip>
            </Sub>

          </Section>

          {/* ── WORKFLOW ──────────────────────────────────────────────── */}
          <Section id="workflow" title="🔄 Workflow complet d'un examen">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-indigo-200 dark:bg-indigo-800" />
              {[
                { icon: "📝", actor: "Professeur", action: "Crée l'examen et configure le barème, les dates, les groupes autorisés." },
                { icon: "➕", actor: "Professeur", action: "Ajoute les questions (QCM + Code) avec les cas de test." },
                { icon: "👥", actor: "Professeur", action: "Importe les étudiants (CSV ou création manuelle)." },
                { icon: "▶️", actor: "Professeur", action: "Active l'examen. Les étudiants peuvent maintenant y accéder." },
                { icon: "💻", actor: "Étudiant", action: "Se connecte, démarre l'examen, répond aux questions, soumet." },
                { icon: "⏱", actor: "Système", action: "Clôture automatique à la fin de la fenêtre horaire." },
                { icon: "🤖", actor: "Professeur / Système", action: "Lance la correction automatique (QCM + exécution du code)." },
                { icon: "📧", actor: "Système", action: "Envoie un email de résultats à chaque étudiant." },
                { icon: "📊", actor: "Professeur", action: "Consulte le rapport, exporte en PDF ou CSV." },
              ].map((step, i) => (
                <div key={i} className="flex gap-5 pb-6 relative pl-10">
                  <div className="absolute left-1 top-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center z-10">
                    {step.icon}
                  </div>
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${
                      step.actor === "Étudiant" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : step.actor === "Système" ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    }`}>{step.actor}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{step.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── FAQ ───────────────────────────────────────────────────── */}
          <Section id="faq" title="❓ Questions fréquentes">
            {[
              {
                q: "Un étudiant n'a pas reçu l'email de résultats, que faire ?",
                a: "Vérifiez les spams. L'email est envoyé automatiquement après la correction. Si le problème persiste, l'administrateur peut relancer la correction depuis le tableau de bord.",
              },
              {
                q: "L'étudiant a soumis mais son code est noté 0 ?",
                a: "Vérifiez que les cas de test de la question sont bien configurés (entrée et sortie attendue renseignées). Un test sans entrée provoque une erreur EOFError dans le code.",
              },
              {
                q: "Peut-on repasser un examen ?",
                a: "Non. Une fois l'examen soumis, la soumission est définitive. L'administrateur peut créer un nouvel examen si nécessaire.",
              },
              {
                q: "Que se passe-t-il si le candidat change d'onglet pendant l'examen ?",
                a: "Chaque changement d'onglet est comptabilisé et visible dans le rapport d'examen (colonne « Changements d'onglet »). Le professeur peut décider des suites à donner.",
              },
              {
                q: "Quel langage de programmation est supporté ?",
                a: "PyExam supporte uniquement Python 3.10. Les exercices de code C, Java ou autres ne seront pas exécutés correctement.",
              },
              {
                q: "Comment restreindre un examen à une classe spécifique ?",
                a: "Dans la configuration de l'examen, renseignez le champ « Groupes autorisés » avec le nom de classe (ex. « L3INFO »). Assurez-vous que les étudiants ont bien ce nom dans leur profil (colonne class_name).",
              },
            ].map(({ q, a }, i) => (
              <details key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition list-none">
                  <span>{q}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
                  {a}
                </div>
              </details>
            ))}
          </Section>

          {/* Footer */}
          <footer className="text-center text-xs text-gray-400 pb-4">
            PyExam — Documentation v1.0 · Pour toute assistance, contactez votre administrateur.
          </footer>

        </main>
      </div>
    </div>
  );
}
