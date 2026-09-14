"""50 questions PSM I de niveau expert — scénarios d'application.

Usage : docker compose exec backend python seed_bank_psm1_expert.py

Source de vérité : Scrum Guide 2020. Ces questions ne testent pas la
récitation mais le jugement : chaque distracteur est une erreur que
commettent réellement les équipes, et la bonne réponse demande de
distinguer ce que Scrum prescrit de ce qu'il laisse ouvert.

Idempotent : ne fait rien si le pack est déjà présent.
"""

import asyncio

from sqlalchemy import func as sqlfunc
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.question import QuestionType
from app.models.question_bank import BankMCQOption, BankQuestion, DifficultyLevel
from app.models.track import ExamTrack
from app.models.user import User

MARKER_TAG = "expert-pack-v2"
E = DifficultyLevel.expert


def mcq(tags, statement, options, points=1.5):
    correct = [o for o in options if o[2]]
    assert len(correct) == 1, f"Exactement une bonne réponse requise : {statement[:70]}"
    assert len(options) == 4, f"Quatre options requises : {statement[:70]}"
    return {
        "tags": [MARKER_TAG, "psm1", "scrum"] + [t for t in tags if t not in (MARKER_TAG, "psm1", "scrum")],
        "statement": statement,
        "points": points,
        "options": [{"label": l, "text": t, "is_correct": c} for l, t, c in options],
    }


QUESTIONS = [

    mcq(["sprint-goal", "reussite"],
        "À la fin du Sprint, le Sprint Goal est atteint mais deux éléments du Sprint Backlog "
        "ne sont pas terminés. Comment qualifier ce Sprint ?", [
        ("A", "Réussi au regard de son engagement : le Sprint Goal est atteint ; les éléments "
              "inachevés retournent au Product Backlog", True),
        ("B", "Échoué : tous les éléments sélectionnés devaient être terminés", False),
        ("C", "Partiellement réussi : on calcule un pourcentage d'achèvement", False),
        ("D", "Le Sprint doit être prolongé jusqu'à l'achèvement des deux éléments", False),
    ]),
    mcq(["sprint-goal", "reussite"],
        "Situation inverse : tous les éléments du Sprint Backlog sont terminés, mais le "
        "Sprint Goal n'est pas atteint. Quelle lecture est la plus juste ?", [
        ("A", "Le Sprint est réussi, puisque tout le travail prévu est fait", False),
        ("B", "L'engagement du Sprint n'est pas tenu : c'est un sujet d'inspection en Sprint "
              "Review et en Rétrospective", True),
        ("C", "C'est impossible par construction", False),
        ("D", "Le Product Owner doit refuser l'Increment", False),
    ]),
    mcq(["sprint-goal", "portee"],
        "En milieu de Sprint, les Developers identifient un élément absent du Sprint Backlog "
        "mais indispensable pour atteindre le Sprint Goal. Que se passe-t-il ?", [
        ("A", "Il faut attendre le Sprint suivant : le Sprint Backlog est figé", False),
        ("B", "Seul le Product Owner peut ajouter un élément au Sprint Backlog", False),
        ("C", "Les Developers peuvent l'ajouter à leur Sprint Backlog, qui émerge au fil "
              "de leur apprentissage", True),
        ("D", "Cela impose d'annuler le Sprint puis de le replanifier", False),
    ]),
    mcq(["sprint-goal"],
        "Le Product Owner souhaite modifier le Sprint Goal au quatrième jour du Sprint "
        "parce qu'une opportunité commerciale est apparue. Est-ce possible ?", [
        ("A", "Oui, le Product Owner est seul décisionnaire sur le Sprint Goal", False),
        ("B", "Oui, à condition que les Developers soient d'accord", False),
        ("C", "Oui, tant que la durée du Sprint reste inchangée", False),
        ("D", "Non : le Sprint Goal ne change pas pendant le Sprint. Si l'objectif devient "
              "obsolète, le Product Owner peut annuler le Sprint", True),
    ]),
    mcq(["sprint-goal", "planification"],
        "Une Scrum Team formule trois objectifs distincts pour son prochain Sprint. "
        "Que faut-il en penser ?", [
        ("A", "Le Sprint Backlog n'a qu'un seul engagement, le Sprint Goal : trois objectifs "
              "sans cohérence entre eux privent le Sprint de sa raison d'être commune", True),
        ("B", "C'est conforme : un Sprint peut porter autant d'objectifs que nécessaire", False),
        ("C", "Il faut alors découper en trois Sprints parallèles", False),
        ("D", "C'est au Scrum Master de choisir lequel retenir", False),
    ]),
    mcq(["product-owner", "sprint-backlog"],
        "Le Product Owner ajoute lui-même un élément dans le Sprint Backlog pendant le Sprint. "
        "Que dit Scrum ?", [
        ("A", "C'est son droit : il est responsable de la valeur livrée", False),
        ("B", "Le Sprint Backlog appartient aux Developers ; le Product Owner peut négocier "
              "le périmètre avec eux, pas le modifier lui-même", True),
        ("C", "C'est autorisé si l'élément sert le Sprint Goal", False),
        ("D", "C'est autorisé une fois par Sprint au maximum", False),
    ]),
    mcq(["product-owner", "sprint-review"],
        "En Sprint Review, le Product Owner déclare « je refuse cet Increment ». "
        "Que faut-il comprendre du point de vue de Scrum ?", [
        ("A", "La Sprint Review est une porte de validation que le Product Owner ouvre ou ferme", False),
        ("B", "L'Increment est rejeté et le Sprint est considéré comme échoué", False),
        ("C", "Scrum ne connaît pas d'acceptation ou de refus formel en Sprint Review : ce qui "
              "respecte la Definition of Done est terminé, et la Review sert à inspecter et "
              "à adapter le Product Backlog", True),
        ("D", "Les Developers doivent refaire le travail pendant le Sprint suivant sans le replanifier", False),
    ]),
    mcq(["product-owner", "organisation"],
        "Une organisation nomme deux Product Owners sur un même produit, chacun sur un "
        "domaine fonctionnel. Quelle conséquence Scrum met-il en avant ?", [
        ("A", "C'est la pratique recommandée dès que le produit dépasse une équipe", False),
        ("B", "C'est acceptable si les deux se réunissent chaque semaine", False),
        ("C", "C'est acceptable à condition que le Scrum Master arbitre", False),
        ("D", "Un produit n'a qu'un Product Owner : deux ordonnancements concurrents rendent "
              "impossible une vision unique de la valeur et de la priorité", True),
    ]),
    mcq(["product-owner", "parties-prenantes"],
        "Une partie prenante contourne le Product Owner et demande directement aux Developers "
        "d'ajouter une fonctionnalité. Quelle est la réponse la plus conforme ?", [
        ("A", "Les Developers refusent et renvoient la demande vers le Product Owner, seul "
              "responsable du contenu et de l'ordre du Product Backlog", True),
        ("B", "Les Developers s'exécutent : le client est roi", False),
        ("C", "Le Scrum Master décide si la demande est légitime", False),
        ("D", "Les Developers l'ajoutent au Sprint en cours si c'est rapide", False),
    ]),
    mcq(["product-owner", "delegation"],
        "Le Product Owner délègue l'écriture et l'ordonnancement du Product Backlog à un "
        "analyste métier. Quelle affirmation est exacte ?", [
        ("A", "C'est interdit : le Product Owner doit tout rédiger lui-même", False),
        ("B", "La délégation est possible, mais le Product Owner reste responsable "
              "(accountable) du résultat", True),
        ("C", "La responsabilité est transférée à l'analyste métier", False),
        ("D", "Cela nécessite l'accord formel du Scrum Master", False),
    ]),
    mcq(["definition-of-done", "organisation"],
        "L'organisation impose une Definition of Done moins exigeante que celle que la Scrum "
        "Team s'était fixée. Que doit faire l'équipe ?", [
        ("A", "S'aligner sur celle de l'organisation, qui fait autorité", False),
        ("B", "Négocier une version intermédiaire avec le management", False),
        ("C", "Conserver la sienne : la Definition of Done de l'organisation est un minimum, "
              "la Scrum Team peut être plus stricte, jamais moins", True),
        ("D", "Demander au Product Owner de trancher", False),
    ]),
    mcq(["definition-of-done", "qualite"],
        "Sous pression d'une date, une Scrum Team envisage d'assouplir sa Definition of Done "
        "pour le Sprint en cours. Quelle est la conséquence ?", [
        ("A", "C'est un arbitrage normal entre qualité et délai", False),
        ("B", "C'est autorisé si le Product Owner l'accepte par écrit", False),
        ("C", "C'est autorisé une fois, à condition de revenir en arrière au Sprint suivant", False),
        ("D", "Cela revient à déplacer la définition du « terminé » pour faire entrer du "
              "travail inachevé dans l'Increment : la transparence sur l'état réel du produit "
              "est perdue", True),
    ]),
    mcq(["definition-of-done", "increment"],
        "Un élément respecte intégralement la Definition of Done, mais le Product Owner ne "
        "souhaite pas le mettre en production. Quel est son statut ?", [
        ("A", "Il est terminé et fait partie de l'Increment ; la décision de le publier "
              "appartient au Product Owner", True),
        ("B", "Il n'est pas terminé tant qu'il n'est pas en production", False),
        ("C", "Il retourne au Product Backlog en attendant la publication", False),
        ("D", "Il faut le retirer de l'Increment pour préserver la transparence", False),
    ]),
    mcq(["definition-of-done", "increment"],
        "Trois jours après une Sprint Review, un défaut est découvert sur un élément déclaré "
        "terminé. Quelle lecture est la plus conforme à Scrum ?", [
        ("A", "L'élément n'aurait jamais dû être déclaré terminé : le Sprint est invalidé", False),
        ("B", "Le correctif devient un élément du Product Backlog, et la Definition of Done "
              "mérite d'être inspectée en Rétrospective", True),
        ("C", "Les Developers doivent corriger immédiatement, hors de tout Sprint", False),
        ("D", "Le Product Owner doit retirer l'élément de l'Increment publié", False),
    ]),
    mcq(["definition-of-done", "travail-non-termine"],
        "En fin de Sprint, un élément est terminé « à 90 % ». Comment est-il traité ?", [
        ("A", "Il compte pour 90 % de ses points dans le Sprint", False),
        ("B", "Il est présenté en Sprint Review comme presque terminé", False),
        ("C", "Il n'est pas terminé : il ne fait pas partie de l'Increment et retourne "
              "au Product Backlog pour être ré-estimé et ré-ordonné", True),
        ("D", "Il est automatiquement reporté en tête du Sprint Backlog suivant", False),
    ]),
    mcq(["sprint-planning"],
        "La timebox du Sprint Planning est atteinte alors que le « Comment » n'a été traité "
        "que pour les premiers éléments. Que fait l'équipe ?", [
        ("A", "Elle prolonge la réunion jusqu'à traiter tous les éléments", False),
        ("B", "Elle réduit le périmètre jusqu'à pouvoir tout détailler", False),
        ("C", "Elle reporte le démarrage du Sprint au lendemain", False),
        ("D", "Elle démarre le Sprint : le plan n'a besoin d'être détaillé que pour les "
              "premiers jours, le Sprint Backlog émerge au fil du Sprint", True),
    ]),
    mcq(["daily-scrum"],
        "Un Developer est en déplacement et ne peut pas assister au Daily Scrum. "
        "Quelle est la conduite la plus conforme ?", [
        ("A", "Le Daily Scrum a lieu : les Developers présents inspectent la progression vers "
              "le Sprint Goal, et l'absent trouve un moyen de contribuer à l'adaptation du plan", True),
        ("B", "Le Daily Scrum est annulé ce jour-là", False),
        ("C", "Le Scrum Master le remplace et parle en son nom", False),
        ("D", "Le Daily Scrum est reporté au retour du Developer", False),
    ]),
    mcq(["sprint-review", "parties-prenantes"],
        "Aucune partie prenante ne se présente à la Sprint Review, Sprint après Sprint. "
        "Quelle est la meilleure lecture de la situation ?", [
        ("A", "La Sprint Review devient inutile et peut être supprimée", False),
        ("B", "C'est un obstacle à la transparence et à l'adaptation, que le Scrum Master "
              "doit aider l'organisation à lever", True),
        ("C", "Le Product Owner remplace les parties prenantes dans leur rôle d'inspection", False),
        ("D", "Il faut rendre la présence obligatoire par décision hiérarchique", False),
    ]),
    mcq(["retrospective", "amelioration"],
        "Une équipe identifie en Rétrospective une amélioration importante mais ne la met "
        "jamais en œuvre, faute de temps. Quelle est la pratique la plus efficace ?", [
        ("A", "Tenir un registre d'améliorations à traiter quand l'activité ralentira", False),
        ("B", "Confier l'amélioration au Scrum Master, qui la réalisera seul", False),
        ("C", "Inscrire l'amélioration dans le Sprint Backlog du Sprint suivant, pour qu'elle "
              "soit visible et traitée au même titre que le reste du travail", True),
        ("D", "Allonger le Sprint pour dégager du temps d'amélioration", False),
    ]),
    mcq(["evenements"],
        "Une équipe expérimentée propose de supprimer le Sprint Planning et de « démarrer "
        "directement », estimant connaître son travail. Que répondre ?", [
        ("A", "C'est acceptable pour une équipe mature et stable", False),
        ("B", "C'est acceptable si le Product Backlog est parfaitement raffiné", False),
        ("C", "C'est au Product Owner d'en décider", False),
        ("D", "Sans Sprint Planning, il n'y a ni Sprint Goal ni Sprint Backlog : le Sprint "
              "perd son engagement et son plan, et ce n'est plus Scrum", True),
    ]),
    mcq(["sprint-review", "evenements"],
        "Pour des raisons d'agenda, une organisation veut tenir la Sprint Review deux jours "
        "avant la fin du Sprint. Quel est le problème principal ?", [
        ("A", "On inspecte alors un résultat incomplet, et le travail des deux derniers jours "
              "échappe à l'inspection des parties prenantes", True),
        ("B", "Aucun, tant que tout le monde est disponible", False),
        ("C", "Cela raccourcit mécaniquement le Sprint de deux jours", False),
        ("D", "Cela oblige à décaler la Rétrospective au Sprint suivant", False),
    ]),
    mcq(["scrum-master", "organisation"],
        "Un Scrum Master accompagne cinq Scrum Teams simultanément et n'est presque jamais "
        "disponible. Que dit Scrum ?", [
        ("A", "Scrum interdit à un Scrum Master de servir plus d'une équipe", False),
        ("B", "Scrum ne fixe aucun nombre, mais le Scrum Master reste responsable de "
              "l'efficacité de chaque équipe qu'il sert : une disponibilité insuffisante "
              "l'empêche d'assumer cette responsabilité", True),
        ("C", "C'est conforme : le Scrum Master n'a pas besoin d'être présent au quotidien", False),
        ("D", "Il doit déléguer son rôle à un Developer dans chaque équipe", False),
    ]),
    mcq(["scrum-master", "metriques"],
        "La direction demande au Scrum Master de communiquer la vélocité de chaque équipe "
        "pour les comparer entre elles. Quelle réponse est la plus appropriée ?", [
        ("A", "Transmettre les chiffres : la transparence l'exige", False),
        ("B", "Refuser sans explication : ce n'est pas le sujet du Scrum Master", False),
        ("C", "Expliquer que la vélocité est un outil de prévision interne à une équipe, non "
              "comparable d'une équipe à l'autre, et aider la direction à s'intéresser "
              "à la valeur livrée", True),
        ("D", "Transmettre les chiffres en les normalisant par le nombre de Developers", False),
    ]),
    mcq(["scrum-master", "equipe"],
        "Le Scrum Master estime qu'un Developer nuit à l'équipe et souhaite l'écarter. "
        "Que dit Scrum de cette décision ?", [
        ("A", "Le Scrum Master a autorité pour composer l'équipe", False),
        ("B", "Il doit demander au Product Owner de procéder au retrait", False),
        ("C", "Il peut l'écarter après un vote de la Scrum Team", False),
        ("D", "Scrum ne donne pas au Scrum Master le pouvoir de composer l'équipe ; son levier "
              "est le coaching de l'équipe et de l'organisation sur l'auto-gestion", True),
    ]),
    mcq(["scrum-master", "management"],
        "Le management demande au Scrum Master d'évaluer individuellement les Developers pour "
        "les entretiens annuels. Quelle est la difficulté de fond ?", [
        ("A", "Cela place le Scrum Master en position d'évaluateur de ceux qu'il doit servir, "
              "ce qui ruine la sécurité nécessaire à la transparence de l'équipe", True),
        ("B", "Aucune : le Scrum Master observe l'équipe au quotidien", False),
        ("C", "Le Scrum Master doit accepter mais ne noter que les aspects techniques", False),
        ("D", "C'est au Product Owner de réaliser ces évaluations", False),
    ]),
    mcq(["scrum-master", "posture"],
        "Un Scrum Master passe ses journées à vérifier que chacun respecte les règles Scrum "
        "et signale les écarts au management. Quel est le principal défaut de cette posture ?", [
        ("A", "Aucun : faire respecter Scrum est sa responsabilité", False),
        ("B", "Il agit en contrôleur alors que le Scrum Guide le décrit comme un véritable "
              "leader qui sert ; le contrôle hiérarchique détruit l'auto-gestion qu'il "
              "devrait faire grandir", True),
        ("C", "Il devrait signaler les écarts au Product Owner plutôt qu'au management", False),
        ("D", "Il devrait automatiser ces vérifications", False),
    ]),
    mcq(["developers", "auto-gestion"],
        "Deux Developers sont en désaccord profond sur une approche technique et le blocage "
        "dure. Qui tranche ?", [
        ("A", "Le Scrum Master, garant du bon fonctionnement de l'équipe", False),
        ("B", "Le Product Owner, puisque cela affecte la livraison", False),
        ("C", "Les Developers eux-mêmes : ils sont auto-gérés et décident comment le travail "
              "est réalisé", True),
        ("D", "L'architecte de l'organisation", False),
    ]),
    mcq(["developers", "competences"],
        "Il manque à la Scrum Team une compétence indispensable au Sprint Goal. "
        "Quelle réponse est la plus conforme à Scrum ?", [
        ("A", "Sous-traiter cette partie à une équipe externe le temps du Sprint", False),
        ("B", "Retirer du Sprint tout élément nécessitant cette compétence, définitivement", False),
        ("C", "Le Scrum Master réalise lui-même cette partie du travail", False),
        ("D", "La Scrum Team doit être pluridisciplinaire : elle doit acquérir ou intégrer "
              "la compétence, c'est un obstacle à traiter avec l'organisation", True),
    ]),
    mcq(["developers", "sprint-backlog"],
        "Le Sprint Backlog d'une équipe n'a pas été mis à jour depuis trois jours. "
        "Quel pilier est directement affecté ?", [
        ("A", "La transparence : sans image fidèle et à jour du travail restant, ni l'équipe "
              "ni personne ne peut inspecter utilement la progression", True),
        ("B", "L'adaptation uniquement", False),
        ("C", "Aucun, tant que le Sprint Goal est atteint à la fin", False),
        ("D", "L'engagement, qui est le quatrième pilier", False),
    ]),
    mcq(["product-backlog", "refinement"],
        "Un Product Backlog comporte 600 éléments, tous estimés et détaillés au même niveau. "
        "Quel est le problème le plus sérieux ?", [
        ("A", "Le nombre d'éléments : Scrum en fixe un maximum", False),
        ("B", "Détailler uniformément revient à investir lourdement dans des éléments lointains "
              "qui changeront ou disparaîtront ; le raffinement se concentre sur le haut "
              "du Product Backlog", True),
        ("C", "Un Product Backlog doit être entièrement raffiné avant le premier Sprint", False),
        ("D", "Aucun problème : c'est le signe d'une bonne préparation", False),
    ]),
    mcq(["sprint-backlog", "prevision"],
        "Le Scrum Guide décrit les éléments sélectionnés au Sprint Planning comme une "
        "prévision (forecast) plutôt qu'une promesse. Quelle en est la portée ?", [
        ("A", "L'équipe n'est engagée sur rien et peut livrer ce qu'elle veut", False),
        ("B", "C'est une simple nuance de vocabulaire sans effet pratique", False),
        ("C", "L'engagement porte sur le Sprint Goal, pas sur la livraison intégrale des "
              "éléments sélectionnés, qui reste une prévision révisable", True),
        ("D", "Cela signifie que les estimations doivent être exactes à 90 %", False),
    ]),
    mcq(["product-backlog", "bugs"],
        "Où les corrections de défauts trouvent-elles leur place dans Scrum ?", [
        ("A", "Dans un backlog de défauts séparé, géré par l'équipe de test", False),
        ("B", "Elles sont traitées hors Sprint, dès qu'elles sont découvertes", False),
        ("C", "Scrum impose de réserver 20 % de chaque Sprint aux défauts", False),
        ("D", "Dans le Product Backlog, ordonnées par le Product Owner comme tout autre "
              "élément nécessaire à l'amélioration du produit", True),
    ]),
    mcq(["product-backlog", "recherche"],
        "Les Developers ont besoin d'une phase de recherche technique avant de pouvoir estimer "
        "un élément important. Comment Scrum traite-t-il ce besoin ?", [
        ("A", "Ce travail de recherche est un élément du Product Backlog comme un autre, "
              "ordonné par le Product Owner et réalisable dans un Sprint", True),
        ("B", "Scrum l'interdit : tout travail doit produire de la valeur métier", False),
        ("C", "Il faut un « Sprint de recherche » dédié, sans Increment", False),
        ("D", "C'est au Scrum Master de mener cette recherche", False),
    ]),
    mcq(["product-goal", "prevision"],
        "La direction demande un engagement ferme sur une roadmap détaillée à dix-huit mois. "
        "Quelle réponse est la plus conforme à l'empirisme ?", [
        ("A", "Refuser toute forme de prévision : Scrum ne planifie pas à long terme", False),
        ("B", "Proposer un Product Goal et des prévisions fondées sur les données réelles des "
              "Sprints passés, révisées à mesure que l'on apprend", True),
        ("C", "S'engager fermement : c'est ce que demande le client", False),
        ("D", "Déléguer cette question au Scrum Master", False),
    ]),
    mcq(["increment", "livraison"],
        "Une Scrum Team produit un Increment conforme à la Definition of Done mais ne le "
        "publie pas. Est-ce toujours un Increment ?", [
        ("A", "Non : sans publication, il n'y a pas d'Increment", False),
        ("B", "Oui, mais seulement pendant le Sprint où il a été créé", False),
        ("C", "Oui : un Increment doit être utilisable, pas nécessairement publié ; "
              "la décision de publier appartient au Product Owner", True),
        ("D", "Non : il redevient du travail en cours au Sprint suivant", False),
    ]),
    mcq(["increment", "sprint"],
        "Une équipe livre en production onze fois au cours d'un même Sprint. Est-ce conforme ?", [
        ("A", "Non : un Sprint produit un seul Increment, livré à la fin", False),
        ("B", "Oui, mais la Sprint Review devient alors facultative", False),
        ("C", "Non : livrer pendant le Sprint compromet le Sprint Goal", False),
        ("D", "Oui : plusieurs Increments peuvent être créés dans un Sprint et livrés dès "
              "qu'ils apportent de la valeur, sans attendre la Sprint Review", True),
    ]),
    mcq(["increment", "qualite"],
        "Une organisation planifie un « Sprint de durcissement » sans nouvelle fonctionnalité, "
        "consacré aux tests et à la stabilisation avant chaque publication. Quel diagnostic ?", [
        ("A", "C'est le symptôme d'une Definition of Done trop faible : si un Increment "
              "nécessite un Sprint de rattrapage, c'est qu'il n'était pas réellement terminé", True),
        ("B", "C'est une bonne pratique pour sécuriser les mises en production", False),
        ("C", "C'est conforme tant que ce Sprint a un Sprint Goal", False),
        ("D", "C'est obligatoire dès que le produit dépasse une certaine taille", False),
    ]),
    mcq(["sprint", "annulation"],
        "Un Sprint est annulé au dixième jour. Que deviennent les éléments qui étaient "
        "terminés au sens de la Definition of Done ?", [
        ("A", "Ils sont perdus : l'annulation invalide tout le travail du Sprint", False),
        ("B", "Ils sont revus et, s'ils sont potentiellement livrables, le Product Owner "
              "les accepte généralement ; les éléments inachevés retournent au Product Backlog", True),
        ("C", "Ils sont automatiquement reportés dans le Sprint Backlog suivant", False),
        ("D", "Ils doivent être refaits dans le Sprint suivant pour être validés", False),
    ]),
    mcq(["sprint", "annulation"],
        "Les parties prenantes exigent l'annulation d'un Sprint qu'elles jugent mal orienté. "
        "Que dit Scrum ?", [
        ("A", "Elles peuvent l'exiger si elles financent le produit", False),
        ("B", "L'annulation requiert un vote de la Scrum Team", False),
        ("C", "Seul le Product Owner a l'autorité d'annuler un Sprint, même s'il peut être "
              "influencé par les parties prenantes, la Scrum Team ou le management", True),
        ("D", "Le Scrum Master annule le Sprint sur leur demande", False),
    ]),
    mcq(["scaling", "increment"],
        "Trois Scrum Teams travaillent sur le même produit. Comment leurs Increments "
        "se combinent-ils en fin de Sprint ?", [
        ("A", "Chaque équipe publie son propre Increment indépendamment", False),
        ("B", "Une équipe d'intégration dédiée assemble les livrables après le Sprint", False),
        ("C", "L'intégration est traitée lors d'un Sprint de consolidation trimestriel", False),
        ("D", "Leurs Increments doivent être intégrés en un Increment unique, utilisable, "
              "conforme à une Definition of Done partagée", True),
    ]),
    mcq(["scaling", "dependances"],
        "Le Sprint Goal d'une équipe dépend d'un travail attendu d'une autre équipe, qui prend "
        "du retard. Quelle est la meilleure conduite ?", [
        ("A", "Rendre la dépendance visible sans délai et adapter le plan avec le Product "
              "Owner ; une dépendance récurrente est un obstacle organisationnel à traiter", True),
        ("B", "Attendre passivement et signaler l'échec en Sprint Review", False),
        ("C", "Absorber la tâche de l'autre équipe sans la prévenir", False),
        ("D", "Annuler le Sprint automatiquement", False),
    ]),
    mcq(["sprint", "duree"],
        "Une équipe ne parvient jamais à terminer son travail et demande à passer de Sprints "
        "de deux semaines à des Sprints de deux mois. Quel est le principal contre-argument ?", [
        ("A", "Des Sprints plus longs coûtent plus cher en réunions", False),
        ("B", "Le Scrum Guide plafonne le Sprint à un mois, et allonger la boucle retarde "
              "l'inspection, augmente le risque et masque la cause réelle du problème", True),
        ("C", "Il faudrait au contraire passer à des Sprints d'une journée", False),
        ("D", "Aucun : allonger le Sprint est la réponse adaptée à un travail complexe", False),
    ]),
    mcq(["organisation", "contrat"],
        "Un contrat fixe à l'avance le périmètre, le délai et le budget. Quelle approche est "
        "la plus cohérente avec Scrum ?", [
        ("A", "Renoncer à Scrum : il est incompatible avec tout contrat", False),
        ("B", "Livrer d'abord tout le périmètre, puis appliquer Scrum pour la maintenance", False),
        ("C", "Utiliser les Sprints pour livrer d'abord ce qui a le plus de valeur et rendre "
              "l'avancement réel transparent, afin de renégocier le périmètre sur des faits", True),
        ("D", "Signer le contrat puis ignorer le périmètre convenu", False),
    ]),
    mcq(["organisation", "interruptions"],
        "Une équipe produit est régulièrement interrompue par des demandes de support urgentes. "
        "Quelle est la réponse la plus conforme à Scrum ?", [
        ("A", "Accepter toutes les interruptions : le support prime sur le Sprint", False),
        ("B", "Créer une équipe Scrum distincte dédiée au support, sans Product Owner", False),
        ("C", "Interdire toute interruption pendant le Sprint, sans exception", False),
        ("D", "Rendre ce travail visible dans le Product Backlog et le Sprint Backlog, pour "
              "que son coût réel apparaisse et que le Product Owner puisse arbitrer", True),
    ]),
    mcq(["auto-gestion", "organisation"],
        "Une organisation conserve des chefs de projet qui affectent les tâches aux Developers "
        "en parallèle du Sprint Backlog. Quel est le conflit de fond ?", [
        ("A", "Cela retire aux Developers la décision de qui fait quoi et comment, qui est "
              "au cœur de l'auto-gestion de la Scrum Team", True),
        ("B", "Le coût salarial de ces postes", False),
        ("C", "Aucun, si les chefs de projet consultent le Product Owner", False),
        ("D", "Cela double simplement la charge de reporting", False),
    ]),
    mcq(["scrum-master", "adoption"],
        "Une organisation adopte les événements et les artefacts Scrum mais conserve des "
        "décisions entièrement descendantes. Que produit cette situation ?", [
        ("A", "Une adoption progressive et satisfaisante de Scrum", False),
        ("B", "Les formes de Scrum sans l'empirisme : les événements deviennent du rituel, "
              "et les problèmes que Scrum devait rendre visibles restent masqués", True),
        ("C", "Une variante de Scrum reconnue par le Scrum Guide", False),
        ("D", "Un fonctionnement équivalent, seul le vocabulaire diffère", False),
    ]),
    mcq(["daily-scrum", "auto-gestion"],
        "Pendant le Daily Scrum, les Developers constatent qu'ils n'atteindront pas le Sprint "
        "Goal avec le plan actuel. Que doivent-ils faire ?", [
        ("A", "Terminer le Sprint comme prévu et en discuter en Rétrospective", False),
        ("B", "Attendre l'autorisation du Scrum Master pour modifier le plan", False),
        ("C", "Adapter leur Sprint Backlog immédiatement, et solliciter le Product Owner si "
              "le périmètre doit être renégocié", True),
        ("D", "Demander une prolongation du Sprint au Product Owner", False),
    ]),
    mcq(["definition-of-done", "transparence"],
        "Une Scrum Team ne dispose d'aucune Definition of Done et son organisation n'en "
        "fournit pas. Quelle est la conséquence immédiate ?", [
        ("A", "L'équipe applique par défaut celle du Scrum Guide", False),
        ("B", "Le Product Owner décide au cas par cas ce qui est terminé", False),
        ("C", "L'équipe peut fonctionner sans, tant que les tests passent", False),
        ("D", "La Scrum Team doit en créer une : sans elle, personne ne peut dire ce qui est "
              "terminé, et l'Increment perd toute signification", True),
    ]),
    mcq(["product-owner", "valeur"],
        "Le Product Owner ordonne systématiquement le Product Backlog selon le coût de "
        "développement croissant, du moins cher au plus cher. Quel est le problème ?", [
        ("A", "Le Product Owner est responsable de maximiser la valeur : ordonner par coût "
              "seul peut repousser indéfiniment ce qui compte le plus pour les utilisateurs", True),
        ("B", "Aucun : commencer par le plus simple est une bonne pratique", False),
        ("C", "Scrum impose d'ordonner par ordre alphabétique des éléments", False),
        ("D", "Cela empêche de calculer la vélocité", False),
    ]),
    mcq(["retrospective", "evenements"],
        "Une Scrum Team souhaite fusionner la Sprint Review et la Rétrospective en un seul "
        "événement pour gagner du temps. Quel est le risque principal ?", [
        ("A", "Dépasser la timebox cumulée des deux événements", False),
        ("B", "Les deux inspectent des objets différents — le produit d'un côté, la façon de "
              "travailler de l'autre — et les mélanger conduit à sacrifier l'un des deux, "
              "en pratique l'amélioration de l'équipe", True),
        ("C", "Les parties prenantes découvriraient les tensions internes", False),
        ("D", "Aucun risque si le Scrum Master anime les deux parties", False),
    ]),

]


async def seed_expert_pack() -> None:
    async with AsyncSessionLocal() as db:
        count_result = await db.execute(
            select(sqlfunc.count())
            .select_from(BankQuestion)
            .where(BankQuestion.tags.contains([MARKER_TAG]))
        )
        count = count_result.scalar() or 0
        if count > 0:
            print(f"Pack déjà présent ({count} question(s) avec le tag '{MARKER_TAG}'). Abandon.")
            return

        admin_result = await db.execute(select(User).where(User.email == "admin@pyexam.com"))
        admin = admin_result.scalar_one_or_none()
        if admin is None:
            print("Admin introuvable. Lancez d'abord seed.py.")
            return

        for q_data in QUESTIONS:
            q = BankQuestion(
                type=QuestionType.mcq,
                difficulty=E,
                exam_type=ExamTrack.psm1,
                tags=q_data["tags"],
                statement=q_data["statement"],
                points=q_data["points"],
                test_cases=None,
                created_by=admin.id,
            )
            db.add(q)
            await db.flush()
            for opt in q_data["options"]:
                db.add(BankMCQOption(question_id=q.id, **opt))

        await db.commit()

    print(f"✓ {len(QUESTIONS)} questions PSM I expertes ajoutées à la banque.")


if __name__ == "__main__":
    asyncio.run(seed_expert_pack())
