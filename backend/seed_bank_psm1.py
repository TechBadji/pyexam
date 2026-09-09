"""Peuplement de la banque de questions PSM I (Professional Scrum Master).

Usage : docker compose exec backend python seed_bank_psm1.py

Source de vérité : Scrum Guide 2020 (Schwaber & Sutherland) + Manifeste Agile.
Toutes les questions portent exam_type = psm1 et le tag "psm1".
Idempotent : ne fait rien si la banque contient déjà des questions PSM I.
"""

import asyncio

from sqlalchemy import func as sqlfunc
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.question import QuestionType
from app.models.question_bank import BankMCQOption, BankQuestion, DifficultyLevel
from app.models.track import ExamTrack
from app.models.user import User

# ── helpers ───────────────────────────────────────────────────────────────────

MARKER_TAG = "psm1"


def mcq(difficulty, tags, statement, options, points=1.0):
    correct = [o for o in options if o[2]]
    assert len(correct) == 1, f"Exactement une réponse correcte requise : {statement[:70]}"
    return {
        "type": QuestionType.mcq,
        "difficulty": difficulty,
        "tags": [MARKER_TAG, "scrum"] + [t for t in tags if t not in (MARKER_TAG, "scrum")],
        "statement": statement,
        "points": points,
        "options": [{"label": l, "text": t, "is_correct": c} for l, t, c in options],
    }


B = DifficultyLevel.beginner
I = DifficultyLevel.intermediate
E = DifficultyLevel.expert
C = DifficultyLevel.culture

QUESTIONS = [

    # ════════════════════════════════════════════════════════════════════════
    # FONDAMENTAUX — Théorie, piliers, valeurs
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["fondamentaux", "definition"],
        "Selon le Scrum Guide 2020, comment Scrum est-il défini ?", [
        ("A", "Une méthodologie complète de développement logiciel", False),
        ("B", "Un framework léger qui aide les personnes, les équipes et les organisations "
              "à générer de la valeur par des solutions adaptatives", True),
        ("C", "Un processus normalisé imposant un ensemble de pratiques d'ingénierie", False),
        ("D", "Une méthode de gestion de projet prédictive", False),
    ]),

    mcq(B, ["fondamentaux", "empirisme"],
        "Sur quels fondements théoriques Scrum repose-t-il ?", [
        ("A", "L'empirisme et le lean thinking", True),
        ("B", "Le cycle en V et la gestion des risques", False),
        ("C", "La théorie des contraintes et Six Sigma", False),
        ("D", "La planification prédictive et le chemin critique", False),
    ]),

    mcq(B, ["fondamentaux", "piliers"],
        "Quels sont les trois piliers de l'empirisme dans Scrum ?", [
        ("A", "Planification, exécution, contrôle", False),
        ("B", "Transparence, inspection, adaptation", True),
        ("C", "Engagement, courage, respect", False),
        ("D", "Vélocité, qualité, prévisibilité", False),
    ]),

    mcq(B, ["fondamentaux", "valeurs"],
        "Combien de valeurs Scrum le Scrum Guide énonce-t-il ?", [
        ("A", "3", False), ("B", "4", False), ("C", "5", True), ("D", "7", False),
    ]),

    mcq(B, ["fondamentaux", "valeurs"],
        "Laquelle de ces propositions liste correctement les cinq valeurs Scrum ?", [
        ("A", "Engagement, Focus, Ouverture, Respect, Courage", True),
        ("B", "Transparence, Inspection, Adaptation, Respect, Courage", False),
        ("C", "Simplicité, Feedback, Communication, Courage, Respect", False),
        ("D", "Confiance, Autonomie, Maîtrise, Finalité, Courage", False),
    ]),

    mcq(I, ["fondamentaux", "piliers"],
        "Une Scrum Team masque les défauts connus lors de la Sprint Review pour éviter "
        "des questions gênantes. Quel pilier de l'empirisme est directement compromis ?", [
        ("A", "L'adaptation", False),
        ("B", "L'inspection", False),
        ("C", "La transparence", True),
        ("D", "L'engagement", False),
    ]),

    mcq(I, ["fondamentaux", "empirisme"],
        "Pourquoi l'inspection sans transparence est-elle jugée trompeuse dans Scrum ?", [
        ("A", "Parce que l'inspection doit toujours être menée par un auditeur externe", False),
        ("B", "Parce qu'une inspection fondée sur des artefacts incomplets ou trompeurs "
              "conduit à des décisions d'adaptation erronées", True),
        ("C", "Parce que l'inspection n'a de valeur qu'en fin de Sprint", False),
        ("D", "Parce que la transparence est un prérequis contractuel", False),
    ]),

    mcq(B, ["fondamentaux", "lean"],
        "Que vise le lean thinking, sur lequel Scrum s'appuie ?", [
        ("A", "Réduire le gaspillage et se concentrer sur l'essentiel", True),
        ("B", "Maximiser l'utilisation de chaque ressource à 100 %", False),
        ("C", "Documenter exhaustivement avant de produire", False),
        ("D", "Externaliser les activités non stratégiques", False),
    ]),

    mcq(I, ["fondamentaux", "adoption"],
        "Le Scrum Guide indique que Scrum est immuable. Qu'est-ce que cela signifie ?", [
        ("A", "Aucune pratique complémentaire ne peut être ajoutée à Scrum", False),
        ("B", "On peut implémenter Scrum partiellement tant que les résultats suivent", False),
        ("C", "Des éléments peuvent être ajoutés autour de Scrum, mais omettre une de ses "
              "parties masque des problèmes et rend le résultat non-Scrum", True),
        ("D", "Le Scrum Guide ne sera plus jamais mis à jour", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # LA SCRUM TEAM ET SES RESPONSABILITÉS
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["equipe", "responsabilites"],
        "Combien de responsabilités (accountabilities) le Scrum Guide 2020 définit-il "
        "au sein de la Scrum Team ?", [
        ("A", "2", False), ("B", "3", True), ("C", "4", False), ("D", "5", False),
    ]),

    mcq(B, ["equipe", "responsabilites"],
        "Quelles sont les trois responsabilités de la Scrum Team ?", [
        ("A", "Product Owner, Scrum Master, Developers", True),
        ("B", "Product Owner, Scrum Master, Development Team", False),
        ("C", "Chef de projet, Product Owner, Équipe technique", False),
        ("D", "Product Owner, Scrum Master, Stakeholders", False),
    ]),

    mcq(B, ["equipe", "taille"],
        "Quelle taille le Scrum Guide 2020 recommande-t-il pour une Scrum Team ?", [
        ("A", "Entre 3 et 9 Developers, plus le PO et le Scrum Master", False),
        ("B", "Généralement 10 personnes ou moins au total", True),
        ("C", "Exactement 7 personnes, plus ou moins 2", False),
        ("D", "Le Scrum Guide n'exprime aucune préférence de taille", False),
    ]),

    mcq(B, ["equipe", "caracteristiques"],
        "Comment le Scrum Guide 2020 caractérise-t-il la Scrum Team ?", [
        ("A", "Auto-gérée (self-managing) et pluridisciplinaire (cross-functional)", True),
        ("B", "Auto-organisée et spécialisée par compétence", False),
        ("C", "Dirigée par le Scrum Master et pluridisciplinaire", False),
        ("D", "Structurée en sous-équipes fonctionnelles coordonnées par le PO", False),
    ]),

    mcq(I, ["equipe", "structure"],
        "Que dit le Scrum Guide 2020 à propos des sous-équipes et des hiérarchies "
        "au sein d'une Scrum Team ?", [
        ("A", "Elles sont autorisées si l'équipe dépasse 10 personnes", False),
        ("B", "Il n'existe ni sous-équipes ni hiérarchies dans une Scrum Team", True),
        ("C", "Une hiérarchie technique est nécessaire pour garantir la qualité", False),
        ("D", "Le Product Owner est hiérarchiquement au-dessus des Developers", False),
    ]),

    mcq(I, ["equipe", "auto-gestion"],
        "Que signifie « auto-gérée » (self-managing) pour une Scrum Team ?", [
        ("A", "Elle choisit elle-même ses membres et son budget", False),
        ("B", "Elle décide en interne qui fait quoi, quand et comment", True),
        ("C", "Elle n'a de comptes à rendre à personne dans l'organisation", False),
        ("D", "Elle définit elle-même la vision produit sans le Product Owner", False),
    ]),

    mcq(B, ["product-owner"],
        "De quoi le Product Owner est-il responsable (accountable) ?", [
        ("A", "De maximiser la valeur du produit résultant du travail de la Scrum Team", True),
        ("B", "De la vélocité de l'équipe et du respect des délais", False),
        ("C", "De la qualité technique de l'Increment", False),
        ("D", "De l'animation de tous les événements Scrum", False),
    ]),

    mcq(B, ["product-owner", "product-backlog"],
        "Qui est responsable de la gestion efficace du Product Backlog ?", [
        ("A", "Le Scrum Master", False),
        ("B", "Le Product Owner", True),
        ("C", "Les Developers", False),
        ("D", "Les parties prenantes", False),
    ]),

    mcq(I, ["product-owner"],
        "Le Product Owner peut-il déléguer le travail de gestion du Product Backlog ?", [
        ("A", "Non, il doit tout réaliser personnellement", False),
        ("B", "Oui, il peut le déléguer, mais il en reste responsable (accountable)", True),
        ("C", "Oui, et la responsabilité est alors transférée aux Developers", False),
        ("D", "Uniquement au Scrum Master, jamais aux Developers", False),
    ]),

    mcq(I, ["product-owner"],
        "Le Product Owner est-il un comité ?", [
        ("A", "Oui, c'est généralement un comité produit de 3 à 5 personnes", False),
        ("B", "Non : le Product Owner est une seule personne, qui peut représenter les "
              "besoins d'un comité dans le Product Backlog", True),
        ("C", "Oui, dès que le produit dépasse une équipe", False),
        ("D", "Cela dépend du choix du Scrum Master", False),
    ]),

    mcq(I, ["product-owner", "autorite"],
        "Un directeur exige de réordonner le Product Backlog contre l'avis du Product Owner. "
        "Que dit Scrum ?", [
        ("A", "Le directeur a le dernier mot, il finance le produit", False),
        ("B", "Le Scrum Master arbitre et tranche", False),
        ("C", "Les décisions du Product Owner doivent être respectées par l'ensemble de "
              "l'organisation ; personne ne peut forcer les Developers à travailler sur "
              "un autre ensemble d'exigences", True),
        ("D", "L'équipe vote pour départager les deux", False),
    ]),

    mcq(B, ["scrum-master"],
        "De quoi le Scrum Master est-il responsable (accountable) selon le Scrum Guide 2020 ?", [
        ("A", "De l'efficacité de la Scrum Team et de l'établissement de Scrum "
              "tel que défini dans le Scrum Guide", True),
        ("B", "De la livraison de l'Increment dans les délais", False),
        ("C", "De l'affectation des tâches aux Developers", False),
        ("D", "Du reporting d'avancement à la direction", False),
    ]),

    mcq(B, ["scrum-master", "leadership"],
        "Comment le Scrum Guide 2020 décrit-il le Scrum Master ?", [
        ("A", "Comme un chef de projet agile", False),
        ("B", "Comme un véritable leader qui sert (true leader who serves) la Scrum Team "
              "et l'organisation au sens large", True),
        ("C", "Comme le responsable hiérarchique des Developers", False),
        ("D", "Comme le secrétaire des événements Scrum", False),
    ]),

    mcq(I, ["scrum-master", "services"],
        "Parmi ces activités, laquelle relève du service rendu par le Scrum Master "
        "à l'organisation ?", [
        ("A", "Rédiger les éléments du Product Backlog à la place du Product Owner", False),
        ("B", "Conduire et coacher l'organisation dans son adoption de Scrum", True),
        ("C", "Estimer les éléments à la place des Developers", False),
        ("D", "Valider techniquement chaque Increment avant livraison", False),
    ]),

    mcq(I, ["scrum-master", "obstacles"],
        "Un obstacle bloque les Developers. Quelle est l'attitude la plus conforme "
        "à la responsabilité du Scrum Master ?", [
        ("A", "Résoudre systématiquement lui-même tous les obstacles", False),
        ("B", "Aider à faire lever les obstacles, en coachant l'équipe pour qu'elle "
              "devienne capable d'en traiter davantage elle-même", True),
        ("C", "Escalader immédiatement à la direction", False),
        ("D", "Ignorer l'obstacle : c'est l'affaire du Product Owner", False),
    ]),

    mcq(E, ["scrum-master", "anti-patterns"],
        "Le Scrum Master d'une équipe assigne chaque matin les tâches du Sprint Backlog "
        "aux Developers. Quel est le problème principal ?", [
        ("A", "Aucun, cela accélère le démarrage de la journée", False),
        ("B", "Cela viole l'auto-gestion : ce sont les Developers qui décident "
              "qui fait quoi et comment", True),
        ("C", "Le Product Owner devrait s'en charger à sa place", False),
        ("D", "Le problème est seulement la fréquence : une fois par Sprint suffirait", False),
    ]),

    mcq(B, ["developers"],
        "Laquelle de ces responsabilités n'incombe PAS aux Developers ?", [
        ("A", "Créer un plan pour le Sprint, le Sprint Backlog", False),
        ("B", "Instiller la qualité en respectant la Definition of Done", False),
        ("C", "Ordonner le Product Backlog par valeur", True),
        ("D", "Adapter leur plan chaque jour vers le Sprint Goal", False),
    ]),

    mcq(B, ["developers", "estimation"],
        "Qui réalise les estimations des éléments du Product Backlog ?", [
        ("A", "Le Product Owner, car il connaît la valeur métier", False),
        ("B", "Les personnes qui réaliseront le travail, c'est-à-dire les Developers", True),
        ("C", "Le Scrum Master, pour rester neutre", False),
        ("D", "Un bureau d'estimation externe à l'équipe", False),
    ]),

    mcq(I, ["developers", "qualite"],
        "Un manager demande aux Developers de livrer plus vite en sautant les tests "
        "prévus par la Definition of Done. Quelle est la réponse conforme à Scrum ?", [
        ("A", "Accepter : le manager est responsable du périmètre", False),
        ("B", "Refuser : un travail qui ne respecte pas la Definition of Done ne peut "
              "pas faire partie d'un Increment", True),
        ("C", "Accepter et rattraper la dette au Sprint suivant, avec l'accord du PO", False),
        ("D", "Demander au Scrum Master de trancher", False),
    ]),

    mcq(I, ["equipe", "responsabilites"],
        "Qui est responsable de la qualité du produit dans Scrum ?", [
        ("A", "Le Product Owner seul", False),
        ("B", "L'équipe de test de l'organisation", False),
        ("C", "La Scrum Team entière, les Developers instillant la qualité "
              "en respectant la Definition of Done", True),
        ("D", "Le Scrum Master, garant du processus", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # LE SPRINT
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["sprint", "evenements"],
        "Quelle est la durée maximale d'un Sprint ?", [
        ("A", "Deux semaines", False), ("B", "Un mois", True),
        ("C", "Six semaines", False), ("D", "Un trimestre", False),
    ]),

    mcq(B, ["sprint", "evenements"],
        "Combien d'événements le Scrum Guide 2020 définit-il ?", [
        ("A", "4 événements", False),
        ("B", "5 : le Sprint, qui est un conteneur pour les quatre autres", True),
        ("C", "6, en comptant le Product Backlog Refinement", False),
        ("D", "3 : Planning, Daily, Review", False),
    ]),

    mcq(B, ["sprint"],
        "Quand un nouveau Sprint démarre-t-il ?", [
        ("A", "Le lundi suivant, après une journée tampon", False),
        ("B", "Immédiatement après la conclusion du Sprint précédent", True),
        ("C", "Dès que le Product Backlog a été entièrement raffiné", False),
        ("D", "Quand le Product Owner l'autorise", False),
    ]),

    mcq(B, ["sprint", "annulation"],
        "Qui a l'autorité d'annuler un Sprint ?", [
        ("A", "Le Scrum Master", False),
        ("B", "Le Product Owner", True),
        ("C", "Les Developers à la majorité", False),
        ("D", "Le sponsor du projet", False),
    ]),

    mcq(I, ["sprint", "annulation"],
        "Dans quel cas un Sprint devrait-il être annulé ?", [
        ("A", "Quand l'équipe prend du retard sur ses prévisions", False),
        ("B", "Quand le Sprint Goal devient obsolète", True),
        ("C", "Quand un Developer clé est absent", False),
        ("D", "Quand les parties prenantes changent d'avis sur un élément du backlog", False),
    ]),

    mcq(I, ["sprint", "duree"],
        "Pourquoi les Sprints ont-ils une durée fixe et courte ?", [
        ("A", "Pour faciliter la facturation mensuelle", False),
        ("B", "Pour limiter le risque en coût et en effort à une période, et générer "
              "de la prévisibilité par une inspection/adaptation fréquente", True),
        ("C", "Pour permettre au Product Owner de changer d'équipe régulièrement", False),
        ("D", "Parce que la durée fixe est imposée par les contrats agiles", False),
    ]),

    mcq(I, ["sprint", "portee"],
        "Pendant le Sprint, que dit Scrum à propos du périmètre ?", [
        ("A", "Le périmètre est gelé, plus rien ne peut être discuté", False),
        ("B", "Aucun changement ne doit compromettre le Sprint Goal, mais le périmètre "
              "peut être clarifié et renégocié avec le Product Owner", True),
        ("C", "Le Product Owner peut ajouter librement des éléments au Sprint Backlog", False),
        ("D", "Les Developers doivent accepter toute demande urgente d'un stakeholder", False),
    ]),

    mcq(E, ["sprint", "scenario"],
        "Au milieu d'un Sprint, les Developers constatent qu'ils ne finiront pas tous les "
        "éléments sélectionnés, mais que le Sprint Goal reste atteignable. Que faire ?", [
        ("A", "Prolonger le Sprint de quelques jours", False),
        ("B", "Renégocier le périmètre avec le Product Owner tout en préservant "
              "le Sprint Goal", True),
        ("C", "Annuler le Sprint et repartir sur de nouvelles bases", False),
        ("D", "Livrer les éléments incomplets et les terminer au Sprint suivant", False),
    ]),

    mcq(E, ["sprint", "scenario"],
        "Une Scrum Team termine tous les éléments du Sprint Backlog trois jours avant "
        "la fin du Sprint. Quelle est la meilleure action ?", [
        ("A", "Clore le Sprint plus tôt et démarrer le suivant", False),
        ("B", "Prendre du travail supplémentaire avec le Product Owner, ou investir dans "
              "l'amélioration, en gardant le Sprint à sa durée prévue", True),
        ("C", "Mettre l'équipe en congé jusqu'à la Sprint Review", False),
        ("D", "Allonger le Sprint suivant pour compenser", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # SPRINT PLANNING
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["sprint-planning", "timebox"],
        "Quelle est la timebox maximale du Sprint Planning pour un Sprint d'un mois ?", [
        ("A", "4 heures", False), ("B", "8 heures", True),
        ("C", "2 heures", False), ("D", "Une journée complète, sans limite stricte", False),
    ]),

    mcq(B, ["sprint-planning"],
        "Quels sont les trois sujets abordés lors du Sprint Planning ?", [
        ("A", "Qui, Quand, Combien", False),
        ("B", "Pourquoi ce Sprint a de la valeur, Quoi peut être fait, Comment le faire", True),
        ("C", "Risques, Dépendances, Budget", False),
        ("D", "Bilan du Sprint précédent, Objectifs, Affectation des tâches", False),
    ]),

    mcq(B, ["sprint-planning", "sprint-goal"],
        "Qui définit le Sprint Goal ?", [
        ("A", "Le Product Owner seul", False),
        ("B", "Le Scrum Master, à partir de la vision produit", False),
        ("C", "L'ensemble de la Scrum Team, lors du Sprint Planning", True),
        ("D", "Les parties prenantes lors de la Sprint Review précédente", False),
    ]),

    mcq(I, ["sprint-planning"],
        "Qui décide du nombre d'éléments du Product Backlog embarqués dans le Sprint ?", [
        ("A", "Le Product Owner, qui connaît la priorité", False),
        ("B", "Les Developers, seuls à pouvoir évaluer ce qu'ils peuvent accomplir", True),
        ("C", "Le Scrum Master, sur la base de la vélocité moyenne", False),
        ("D", "Un vote de toute la Scrum Team", False),
    ]),

    mcq(I, ["sprint-planning"],
        "La Scrum Team peut-elle inviter d'autres personnes au Sprint Planning ?", [
        ("A", "Non, l'événement est strictement réservé à la Scrum Team", False),
        ("B", "Oui, elle peut inviter d'autres personnes pour obtenir des conseils", True),
        ("C", "Uniquement le management de l'organisation", False),
        ("D", "Uniquement si le Scrum Master l'autorise par écrit", False),
    ]),

    mcq(I, ["sprint-planning", "sprint-goal"],
        "Que se passe-t-il si la Scrum Team n'arrive pas à formuler un Sprint Goal ?", [
        ("A", "Le Sprint démarre quand même : le Sprint Goal est optionnel", False),
        ("B", "Le Sprint Planning n'est pas terminé : le Sprint Goal est l'engagement "
              "du Sprint Backlog et doit être établi avant la fin de l'événement", True),
        ("C", "Le Scrum Master rédige le Sprint Goal à la place de l'équipe", False),
        ("D", "Le Sprint est annulé automatiquement", False),
    ]),

    mcq(E, ["sprint-planning", "scenario"],
        "Lors du Sprint Planning, les Developers ne parviennent pas à décomposer un élément "
        "volumineux et mal compris. Quelle est la meilleure action ?", [
        ("A", "L'embarquer quand même et improviser pendant le Sprint", False),
        ("B", "En discuter avec le Product Owner pour le clarifier ou le découper, "
              "et sélectionner à la place du travail suffisamment compris", True),
        ("C", "Reporter le Sprint Planning d'une semaine", False),
        ("D", "Demander au Scrum Master de le décomposer techniquement", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # DAILY SCRUM
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["daily-scrum", "timebox"],
        "Quelle est la durée du Daily Scrum ?", [
        ("A", "15 minutes, quelle que soit la durée du Sprint", True),
        ("B", "15 minutes pour un Sprint d'un mois, proportionnellement moins sinon", False),
        ("C", "30 minutes", False),
        ("D", "Non timeboxé, l'équipe s'auto-régule", False),
    ]),

    mcq(B, ["daily-scrum"],
        "Quel est l'objectif du Daily Scrum ?", [
        ("A", "Reporter l'avancement au Scrum Master et au management", False),
        ("B", "Inspecter la progression vers le Sprint Goal et adapter le Sprint Backlog "
              "si nécessaire", True),
        ("C", "Répartir les tâches de la journée entre les Developers par le Scrum Master", False),
        ("D", "Valider les éléments terminés avec le Product Owner", False),
    ]),

    mcq(B, ["daily-scrum"],
        "Qui doit obligatoirement participer au Daily Scrum ?", [
        ("A", "Toute la Scrum Team plus les parties prenantes", False),
        ("B", "Les Developers ; le Product Owner et le Scrum Master y participent s'ils "
              "travaillent activement sur des éléments du Sprint Backlog", True),
        ("C", "Le Scrum Master et les Developers uniquement", False),
        ("D", "Le Product Owner et les Developers uniquement", False),
    ]),

    mcq(I, ["daily-scrum"],
        "Les fameuses « trois questions » (Qu'ai-je fait hier ? Que vais-je faire "
        "aujourd'hui ? Quels obstacles ?) sont-elles obligatoires ?", [
        ("A", "Oui, elles constituent la structure imposée du Daily Scrum", False),
        ("B", "Non : le Scrum Guide 2020 laisse les Developers choisir la structure et "
              "les techniques, du moment que le focus reste la progression vers le Sprint Goal", True),
        ("C", "Oui, mais seulement pour les équipes de plus de cinq personnes", False),
        ("D", "Non, elles ont été remplacées par cinq nouvelles questions obligatoires", False),
    ]),

    mcq(I, ["daily-scrum"],
        "Que dit Scrum sur l'horaire et le lieu du Daily Scrum ?", [
        ("A", "Ils doivent varier pour maintenir l'attention", False),
        ("B", "Il se tient à la même heure et au même endroit chaque jour ouvré du Sprint, "
              "afin de réduire la complexité", True),
        ("C", "Il se tient uniquement les jours où des obstacles existent", False),
        ("D", "L'horaire est fixé chaque jour par le Scrum Master", False),
    ]),

    mcq(E, ["daily-scrum", "scenario"],
        "Un Daily Scrum dérive systématiquement vers des débats techniques de 45 minutes. "
        "Quelle est la meilleure intervention du Scrum Master ?", [
        ("A", "Interdire toute discussion technique dans l'équipe", False),
        ("B", "Coacher l'équipe à respecter la timebox de 15 minutes et à poursuivre "
              "les discussions détaillées immédiatement après, entre les personnes concernées", True),
        ("C", "Allonger officiellement le Daily Scrum à 45 minutes", False),
        ("D", "Supprimer le Daily Scrum et le remplacer par un rapport écrit", False),
    ]),

    mcq(E, ["daily-scrum", "anti-patterns"],
        "Pendant le Daily Scrum, chaque Developer s'adresse au Scrum Master pour rendre "
        "compte de son avancement. Quel est le problème ?", [
        ("A", "Aucun, c'est le rôle du Scrum Master de collecter l'avancement", False),
        ("B", "Le Daily Scrum devient une réunion de reporting alors qu'il s'agit d'un "
              "événement des Developers pour replanifier leur travail", True),
        ("C", "Le Product Owner devrait recevoir ce reporting à la place", False),
        ("D", "Le problème est uniquement la durée de l'événement", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # SPRINT REVIEW
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["sprint-review", "timebox"],
        "Quelle est la timebox maximale de la Sprint Review pour un Sprint d'un mois ?", [
        ("A", "2 heures", False), ("B", "3 heures", False),
        ("C", "4 heures", True), ("D", "8 heures", False),
    ]),

    mcq(B, ["sprint-review"],
        "Quel est l'objet de la Sprint Review ?", [
        ("A", "Inspecter le résultat du Sprint et déterminer les adaptations futures, "
              "avec les parties prenantes", True),
        ("B", "Approuver formellement la mise en production par le comité de pilotage", False),
        ("C", "Évaluer la performance individuelle des Developers", False),
        ("D", "Identifier les améliorations du processus de l'équipe", False),
    ]),

    mcq(I, ["sprint-review"],
        "La Sprint Review est-elle une réunion de statut (status meeting) ?", [
        ("A", "Oui, c'est le point d'avancement mensuel du projet", False),
        ("B", "Non : c'est une session de travail au cours de laquelle la Scrum Team "
              "et les parties prenantes collaborent sur la suite", True),
        ("C", "Oui, mais uniquement pour le Product Owner", False),
        ("D", "Cela dépend du contexte contractuel", False),
    ]),

    mcq(I, ["sprint-review", "product-backlog"],
        "Quelle est une conséquence attendue de la Sprint Review ?", [
        ("A", "Le Product Backlog peut être ajusté pour répondre aux nouvelles opportunités", True),
        ("B", "Le Sprint Goal du Sprint écoulé est réécrit", False),
        ("C", "La Definition of Done est systématiquement renforcée", False),
        ("D", "Les estimations passées sont recalculées", False),
    ]),

    mcq(E, ["sprint-review", "scenario"],
        "À la Sprint Review, le Product Owner refuse de montrer aux parties prenantes "
        "un élément non terminé. A-t-il raison ?", [
        ("A", "Non, tout le travail en cours doit être présenté comme livré", False),
        ("B", "Oui : seul le travail conforme à la Definition of Done fait partie de "
              "l'Increment et peut être présenté comme terminé", True),
        ("C", "Non, c'est au Scrum Master de décider de ce qui est présenté", False),
        ("D", "Oui, mais uniquement si les parties prenantes sont externes", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # SPRINT RETROSPECTIVE
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["retrospective", "timebox"],
        "Quelle est la timebox maximale de la Sprint Retrospective pour un Sprint d'un mois ?", [
        ("A", "1 heure", False), ("B", "3 heures", True),
        ("C", "4 heures", False), ("D", "8 heures", False),
    ]),

    mcq(B, ["retrospective"],
        "Quand la Sprint Retrospective se tient-elle ?", [
        ("A", "Avant la Sprint Review", False),
        ("B", "Après la Sprint Review et avant le Sprint Planning suivant ; "
              "elle conclut le Sprint", True),
        ("C", "Au milieu du Sprint", False),
        ("D", "Une fois par trimestre", False),
    ]),

    mcq(B, ["retrospective"],
        "Qu'inspecte la Sprint Retrospective ?", [
        ("A", "L'Increment et le Product Backlog", False),
        ("B", "Comment le Sprint s'est déroulé concernant les individus, les interactions, "
              "les processus, les outils et la Definition of Done", True),
        ("C", "Uniquement les incidents de production du Sprint", False),
        ("D", "La performance individuelle de chaque Developer", False),
    ]),

    mcq(I, ["retrospective"],
        "Qui participe à la Sprint Retrospective ?", [
        ("A", "Les Developers uniquement", False),
        ("B", "La Scrum Team entière", True),
        ("C", "La Scrum Team et les parties prenantes", False),
        ("D", "Le Scrum Master et les managers", False),
    ]),

    mcq(I, ["retrospective", "amelioration"],
        "Que fait la Scrum Team des améliorations les plus utiles identifiées "
        "en Rétrospective ?", [
        ("A", "Elle les archive dans un registre d'améliorations annuel", False),
        ("B", "Elle peut les adresser au plus tôt, voire les ajouter au Sprint Backlog "
              "du Sprint suivant", True),
        ("C", "Elle les transmet au PMO pour arbitrage", False),
        ("D", "Elle attend la fin du trimestre pour les mettre en œuvre", False),
    ]),

    mcq(E, ["retrospective", "scenario"],
        "Après plusieurs Sprints, les mêmes problèmes reviennent en Rétrospective sans "
        "jamais être traités. Quelle est la meilleure action du Scrum Master ?", [
        ("A", "Supprimer la Rétrospective, devenue inutile", False),
        ("B", "Aider l'équipe à ne retenir qu'une ou deux améliorations concrètes, avec "
              "un propriétaire, et à les rendre visibles dans le Sprint Backlog", True),
        ("C", "Reporter les problèmes à la direction pour qu'elle impose des solutions", False),
        ("D", "Remplacer la Rétrospective par un sondage anonyme trimestriel", False),
    ]),

    mcq(I, ["evenements", "timebox"],
        "Pour un Sprint de deux semaines, que deviennent les timeboxes des événements ?", [
        ("A", "Elles restent identiques à celles d'un Sprint d'un mois", False),
        ("B", "Elles sont généralement plus courtes", True),
        ("C", "Elles sont fixées librement par le Scrum Master", False),
        ("D", "Seule la timebox du Daily Scrum est réduite", False),
    ]),

    mcq(I, ["evenements"],
        "Pourquoi les événements Scrum se tiennent-ils à cadence régulière ?", [
        ("A", "Pour faciliter la planification des congés", False),
        ("B", "Pour créer de la régularité et réduire le besoin de réunions "
              "non définies dans Scrum", True),
        ("C", "Pour permettre au management de suivre l'avancement", False),
        ("D", "Pour respecter les obligations contractuelles", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # ARTEFACTS ET ENGAGEMENTS
    # ════════════════════════════════════════════════════════════════════════

    mcq(B, ["artefacts"],
        "Combien d'artefacts Scrum définit-il ?", [
        ("A", "2", False), ("B", "3", True), ("C", "4", False), ("D", "5", False),
    ]),

    mcq(B, ["artefacts", "engagements"],
        "Quel est l'engagement (commitment) associé au Product Backlog ?", [
        ("A", "Le Sprint Goal", False), ("B", "Le Product Goal", True),
        ("C", "La Definition of Done", False), ("D", "La roadmap produit", False),
    ]),

    mcq(B, ["artefacts", "engagements"],
        "Quel est l'engagement associé au Sprint Backlog ?", [
        ("A", "Le Product Goal", False), ("B", "La Definition of Done", False),
        ("C", "Le Sprint Goal", True), ("D", "La vélocité prévisionnelle", False),
    ]),

    mcq(B, ["artefacts", "engagements"],
        "Quel est l'engagement associé à l'Increment ?", [
        ("A", "La Definition of Done", True), ("B", "Le Sprint Goal", False),
        ("C", "Le Product Goal", False), ("D", "La Definition of Ready", False),
    ]),

    mcq(B, ["product-backlog"],
        "Comment le Product Backlog est-il décrit dans le Scrum Guide 2020 ?", [
        ("A", "Une liste émergente et ordonnée de ce qui est nécessaire pour "
              "améliorer le produit", True),
        ("B", "Une liste figée d'exigences validées en début de projet", False),
        ("C", "Un ensemble de tâches techniques réparties par compétence", False),
        ("D", "Le plan de charge de l'équipe pour le trimestre", False),
    ]),

    mcq(I, ["product-backlog", "refinement"],
        "Le Product Backlog Refinement est-il un événement Scrum ?", [
        ("A", "Oui, c'est le cinquième événement", False),
        ("B", "Non : c'est une activité continue de décomposition et de définition "
              "des éléments du Product Backlog", True),
        ("C", "Oui, il se tient obligatoirement le mercredi de chaque semaine", False),
        ("D", "Non, il a été supprimé de Scrum en 2020", False),
    ]),

    mcq(I, ["product-backlog", "refinement"],
        "Le Scrum Guide 2020 impose-t-il un pourcentage de capacité à consacrer "
        "au refinement ?", [
        ("A", "Oui, 10 % de la capacité", False),
        ("B", "Oui, entre 5 % et 10 %", False),
        ("C", "Non, aucun pourcentage n'est prescrit", True),
        ("D", "Oui, 20 % pour les nouvelles équipes", False),
    ]),

    mcq(B, ["product-goal"],
        "Qu'est-ce que le Product Goal ?", [
        ("A", "L'objectif à long terme de la Scrum Team, décrivant un état futur du produit", True),
        ("B", "La somme des Sprint Goals du trimestre", False),
        ("C", "Le budget alloué au produit pour l'année", False),
        ("D", "Le premier élément du Product Backlog", False),
    ]),

    mcq(I, ["product-goal"],
        "Combien de Product Goals une Scrum Team poursuit-elle à la fois ?", [
        ("A", "Un seul : elle doit atteindre (ou abandonner) un Product Goal "
              "avant de passer au suivant", True),
        ("B", "Un par Sprint", False),
        ("C", "Autant que de parties prenantes majeures", False),
        ("D", "Trois au maximum", False),
    ]),

    mcq(B, ["sprint-backlog"],
        "De quoi le Sprint Backlog est-il composé ?", [
        ("A", "Du Sprint Goal, des éléments sélectionnés et du plan pour les livrer", True),
        ("B", "De la liste des tâches assignées à chaque Developer", False),
        ("C", "Des éléments du Product Backlog les mieux estimés", False),
        ("D", "Du diagramme de Gantt du Sprint", False),
    ]),

    mcq(I, ["sprint-backlog"],
        "À qui appartient le Sprint Backlog ?", [
        ("A", "Au Product Owner", False),
        ("B", "Aux Developers : c'est un plan par et pour eux", True),
        ("C", "Au Scrum Master, qui le maintient à jour", False),
        ("D", "À la Scrum Team, à parts égales", False),
    ]),

    mcq(I, ["sprint-backlog"],
        "À quelle fréquence le Sprint Backlog est-il mis à jour ?", [
        ("A", "Une fois par Sprint, lors du Sprint Planning", False),
        ("B", "Au moins une fois par jour, au fil de l'apprentissage des Developers", True),
        ("C", "À chaque Sprint Review", False),
        ("D", "Uniquement quand un obstacle apparaît", False),
    ]),

    mcq(B, ["increment"],
        "Qu'est-ce qu'un Increment ?", [
        ("A", "Un pas concret vers le Product Goal, utilisable et additif "
              "aux Increments précédents", True),
        ("B", "La somme des tâches réalisées pendant le Sprint", False),
        ("C", "Un prototype jetable présenté aux parties prenantes", False),
        ("D", "La version déployée en production à la fin du trimestre", False),
    ]),

    mcq(I, ["increment"],
        "Combien d'Increments peuvent être créés pendant un même Sprint ?", [
        ("A", "Un seul, à la fin du Sprint", False),
        ("B", "Plusieurs : ils sont présentés à la Sprint Review, mais peuvent être "
              "livrés avant la fin du Sprint", True),
        ("C", "Un par Developer", False),
        ("D", "Aucun tant que la Sprint Review n'a pas eu lieu", False),
    ]),

    mcq(I, ["increment", "definition-of-done"],
        "Un travail qui ne respecte pas la Definition of Done…", [
        ("A", "Peut être présenté comme terminé si le Product Owner l'accepte", False),
        ("B", "Ne peut être ni publié, ni même présenté à la Sprint Review comme "
              "faisant partie de l'Increment", True),
        ("C", "Est automatiquement reporté au Sprint suivant avec ses points", False),
        ("D", "Est considéré comme terminé à 80 %", False),
    ]),

    mcq(B, ["definition-of-done"],
        "Qu'est-ce que la Definition of Done ?", [
        ("A", "Une description formelle de l'état de l'Increment lorsqu'il atteint "
              "les standards de qualité requis pour le produit", True),
        ("B", "La liste des critères d'acceptation d'un élément du Product Backlog", False),
        ("C", "Le contrat de service passé avec le client", False),
        ("D", "L'ensemble des tests automatisés du produit", False),
    ]),

    mcq(I, ["definition-of-done"],
        "Qui crée la Definition of Done ?", [
        ("A", "Toujours la Scrum Team seule", False),
        ("B", "Si l'organisation en fournit une, elle constitue un minimum que la Scrum Team "
              "doit respecter ; sinon la Scrum Team doit créer la sienne", True),
        ("C", "Le Product Owner, avec les parties prenantes", False),
        ("D", "Le Scrum Master, garant de la qualité", False),
    ]),

    mcq(I, ["definition-of-done", "scaling"],
        "Plusieurs Scrum Teams travaillent sur le même produit. Que dit Scrum de "
        "leur Definition of Done ?", [
        ("A", "Chaque équipe définit librement la sienne", False),
        ("B", "Elles doivent mutuellement définir et respecter la même Definition of Done", True),
        ("C", "Seule l'équipe la plus expérimentée définit la Definition of Done", False),
        ("D", "La Definition of Done devient facultative à grande échelle", False),
    ]),

    mcq(I, ["artefacts", "transparence"],
        "Pourquoi chaque artefact porte-t-il un engagement ?", [
        ("A", "Pour renforcer la transparence et fournir un point de référence "
              "permettant de mesurer les progrès", True),
        ("B", "Pour contractualiser la livraison auprès des parties prenantes", False),
        ("C", "Pour permettre au Scrum Master d'évaluer l'équipe", False),
        ("D", "Pour satisfaire aux exigences d'audit", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # PRATIQUES COMPLÉMENTAIRES ET IDÉES REÇUES
    # ════════════════════════════════════════════════════════════════════════

    mcq(I, ["idees-recues", "definition-of-ready"],
        "La « Definition of Ready » fait-elle partie de Scrum ?", [
        ("A", "Oui, c'est le pendant obligatoire de la Definition of Done", False),
        ("B", "Non : c'est une pratique complémentaire, absente du Scrum Guide", True),
        ("C", "Oui, elle est requise avant chaque Sprint Planning", False),
        ("D", "Oui, mais uniquement pour les équipes distribuées", False),
    ]),

    mcq(I, ["idees-recues", "velocite"],
        "Que dit le Scrum Guide 2020 de la vélocité et des burn-down charts ?", [
        ("A", "Ils sont obligatoires pour mesurer la progression", False),
        ("B", "Ils ne sont pas prescrits : ce sont des pratiques complémentaires "
              "utiles mais non exigées", True),
        ("C", "Ils remplacent le Sprint Goal comme engagement", False),
        ("D", "Ils doivent être publiés à la direction chaque Sprint", False),
    ]),

    mcq(I, ["idees-recues", "user-stories"],
        "Les User Stories sont-elles imposées par Scrum ?", [
        ("A", "Oui, tout élément du Product Backlog doit être une User Story", False),
        ("B", "Non : Scrum ne prescrit aucun format pour les éléments du Product Backlog", True),
        ("C", "Oui, sauf pour les éléments techniques", False),
        ("D", "Non, elles sont même interdites dans Scrum", False),
    ]),

    mcq(I, ["idees-recues", "estimation"],
        "Quelle technique d'estimation Scrum impose-t-il ?", [
        ("A", "Le Planning Poker", False),
        ("B", "Les story points en suite de Fibonacci", False),
        ("C", "Aucune : Scrum n'impose aucune technique d'estimation", True),
        ("D", "L'estimation en jours-homme", False),
    ]),

    mcq(I, ["idees-recues", "roles"],
        "Que sont devenus les « rôles » du Scrum Guide 2017 dans la version 2020 ?", [
        ("A", "Ils ont été renommés « accountabilities » (responsabilités) au sein "
              "d'une unique Scrum Team", True),
        ("B", "Ils ont été supprimés sans remplacement", False),
        ("C", "Un quatrième rôle, l'Architecte, a été ajouté", False),
        ("D", "Ils sont désormais optionnels", False),
    ]),

    mcq(I, ["idees-recues", "equipe"],
        "Que dit le Scrum Guide 2020 de la « Development Team » ?", [
        ("A", "Elle reste une équipe distincte au sein de la Scrum Team", False),
        ("B", "Le concept d'équipe dans l'équipe a été supprimé : il n'y a qu'une "
              "Scrum Team focalisée sur un même objectif", True),
        ("C", "Elle a été renommée « Delivery Team »", False),
        ("D", "Elle est désormais limitée à 5 personnes", False),
    ]),

    mcq(E, ["scaling"],
        "Plusieurs Scrum Teams travaillent sur le même produit. Que dit le Scrum Guide ?", [
        ("A", "Chaque équipe a son propre Product Backlog et son propre Product Owner", False),
        ("B", "Elles partagent le même Product Goal, le même Product Backlog "
              "et le même Product Owner", True),
        ("C", "Un Chief Product Owner arbitre entre les Product Owners de chaque équipe", False),
        ("D", "Le Scrum Guide interdit de faire travailler plusieurs équipes "
              "sur un même produit", False),
    ]),

    mcq(E, ["scenario", "auto-gestion"],
        "Un Developer travaille en secret sur une refonte technique non liée au Sprint Goal. "
        "Quelle est la meilleure réaction ?", [
        ("A", "Le signaler à son manager pour sanction", False),
        ("B", "Rendre la situation transparente dans l'équipe : le Sprint Backlog doit "
              "refléter tout le travail en cours et rester focalisé sur le Sprint Goal", True),
        ("C", "Laisser faire : l'auto-gestion autorise chacun à choisir son travail", False),
        ("D", "Ajouter rétroactivement la refonte au Product Backlog sans en parler", False),
    ]),

    mcq(E, ["scenario", "qualite"],
        "L'équipe accumule de la dette technique Sprint après Sprint et sa capacité "
        "de livraison chute. Quelle réponse est la plus conforme à Scrum ?", [
        ("A", "Planifier un « Sprint de stabilisation » sans Sprint Goal produit", False),
        ("B", "Renforcer la Definition of Done et intégrer le travail de remédiation "
              "dans les Sprints à venir, en toute transparence avec le Product Owner", True),
        ("C", "Créer une équipe séparée dédiée à la dette technique", False),
        ("D", "Ignorer la dette tant que les fonctionnalités sortent", False),
    ]),

    mcq(E, ["scenario", "product-owner"],
        "Le Product Owner est absent pendant tout le Sprint et ne répond pas aux questions. "
        "Quelle est la meilleure action du Scrum Master ?", [
        ("A", "Prendre lui-même les décisions produit à la place du Product Owner", False),
        ("B", "Aider l'organisation et le Product Owner à comprendre l'impact de cette "
              "indisponibilité sur la valeur livrée, et à y remédier", True),
        ("C", "Demander aux Developers de deviner les priorités", False),
        ("D", "Suspendre les Sprints jusqu'à son retour", False),
    ]),

    mcq(E, ["scenario", "evenements"],
        "Une organisation veut supprimer la Sprint Retrospective pour « gagner du temps ». "
        "Que doit faire le Scrum Master ?", [
        ("A", "Accepter : les événements sont optionnels si l'équipe est mature", False),
        ("B", "Expliquer qu'omettre un élément de Scrum masque les problèmes et réduit "
              "les bénéfices, et coacher l'organisation sur la valeur de l'inspection "
              "et de l'adaptation", True),
        ("C", "Remplacer la Rétrospective par un point mensuel avec les managers", False),
        ("D", "Réduire la Rétrospective à 5 minutes en fin de Sprint Review", False),
    ]),

    mcq(E, ["scenario", "transparence"],
        "Les parties prenantes se plaignent de ne jamais savoir où en est le produit. "
        "Quelle est la piste la plus conforme à Scrum ?", [
        ("A", "Produire un rapport d'avancement hebdomadaire détaillé", False),
        ("B", "Renforcer leur participation à la Sprint Review et la transparence "
              "du Product Backlog et de l'Increment", True),
        ("C", "Donner aux parties prenantes un accès en écriture au Sprint Backlog", False),
        ("D", "Nommer un chef de projet chargé de la communication", False),
    ]),

    mcq(E, ["scenario", "sprint-goal"],
        "Au troisième jour du Sprint, une urgence commerciale rend le Sprint Goal "
        "sans objet. Que doit-il se passer ?", [
        ("A", "Les Developers changent discrètement de priorités", False),
        ("B", "Le Product Owner peut annuler le Sprint ; les éléments terminés sont "
              "revus et les autres retournent au Product Backlog", True),
        ("C", "Le Scrum Master réécrit le Sprint Goal", False),
        ("D", "L'équipe termine le Sprint tel quel puis en discute en Rétrospective", False),
    ]),

    mcq(E, ["scenario", "equipe"],
        "Les Developers réclament un « Sprint 0 » pour mettre en place l'architecture "
        "avant de commencer. Quelle est la position conforme à Scrum ?", [
        ("A", "Scrum recommande un Sprint 0 pour tout nouveau produit", False),
        ("B", "Scrum ne connaît pas de « Sprint 0 » : chaque Sprint doit produire un "
              "Increment utilisable, le travail d'architecture étant intégré au Sprint", True),
        ("C", "Le Sprint 0 est autorisé s'il dure moins d'une semaine", False),
        ("D", "Le Sprint 0 est obligatoire avant le premier Sprint Planning", False),
    ]),

    mcq(E, ["scenario", "scrum-master"],
        "Un Scrum Master est également Developer dans la même équipe. Est-ce conforme ?", [
        ("A", "Non, le Scrum Guide l'interdit explicitement", False),
        ("B", "Oui, c'est possible : une personne peut porter plusieurs responsabilités, "
              "à condition d'assumer pleinement chacune d'elles", True),
        ("C", "Oui, mais seulement si l'équipe compte moins de 4 personnes", False),
        ("D", "Non, sauf autorisation du Product Owner", False),
    ]),

    # ════════════════════════════════════════════════════════════════════════
    # CULTURE AGILE — MANIFESTE, HISTOIRE, PRATIQUES
    # ════════════════════════════════════════════════════════════════════════

    mcq(C, ["manifeste", "histoire"],
        "En quelle année le Manifeste Agile a-t-il été rédigé ?", [
        ("A", "1995", False), ("B", "2001", True), ("C", "2005", False), ("D", "2010", False),
    ]),

    mcq(C, ["manifeste", "histoire"],
        "Combien de personnes ont signé le Manifeste Agile original ?", [
        ("A", "7", False), ("B", "12", False), ("C", "17", True), ("D", "21", False),
    ]),

    mcq(C, ["manifeste"],
        "Combien de valeurs et de principes le Manifeste Agile comporte-t-il ?", [
        ("A", "4 valeurs et 12 principes", True),
        ("B", "5 valeurs et 10 principes", False),
        ("C", "3 valeurs et 9 principes", False),
        ("D", "4 valeurs et 8 principes", False),
    ]),

    mcq(C, ["manifeste", "valeurs"],
        "Quelle formulation correspond à une valeur du Manifeste Agile ?", [
        ("A", "Les processus et les outils plus que les individus et leurs interactions", False),
        ("B", "Des logiciels opérationnels plus qu'une documentation exhaustive", True),
        ("C", "La négociation contractuelle plus que la collaboration avec les clients", False),
        ("D", "Le suivi d'un plan plus que l'adaptation au changement", False),
    ]),

    mcq(C, ["manifeste", "valeurs"],
        "Que signifie la formule « … plus que … » du Manifeste Agile ?", [
        ("A", "Les éléments de droite n'ont aucune valeur", False),
        ("B", "Les éléments de droite ont de la valeur, mais ceux de gauche en ont "
              "davantage", True),
        ("C", "Les éléments de droite sont interdits en contexte agile", False),
        ("D", "Les deux colonnes ont exactement la même importance", False),
    ]),

    mcq(C, ["manifeste", "principes"],
        "Selon les principes agiles, quelle est la principale mesure de l'avancement ?", [
        ("A", "Le pourcentage de tâches terminées", False),
        ("B", "Un logiciel opérationnel", True),
        ("C", "Le respect du planning initial", False),
        ("D", "Le nombre de story points livrés", False),
    ]),

    mcq(C, ["manifeste", "principes"],
        "Quel principe agile concerne les changements d'exigences ?", [
        ("A", "Ils doivent être gelés après la phase de cadrage", False),
        ("B", "Ils sont accueillis positivement, même tard dans le développement, "
              "pour donner un avantage compétitif au client", True),
        ("C", "Ils sont acceptés uniquement en début de Sprint", False),
        ("D", "Ils nécessitent un avenant contractuel systématique", False),
    ]),

    mcq(C, ["manifeste", "principes"],
        "Que dit le principe agile relatif à la simplicité ?", [
        ("A", "La simplicité consiste à réduire le nombre de réunions", False),
        ("B", "La simplicité — l'art de maximiser la quantité de travail non fait — "
              "est essentielle", True),
        ("C", "La simplicité impose d'écrire le moins de code possible", False),
        ("D", "La simplicité signifie éviter les technologies récentes", False),
    ]),

    mcq(C, ["histoire", "scrum"],
        "Quel article de 1986, publié par Takeuchi et Nonaka, a inspiré Scrum ?", [
        ("A", "The Mythical Man-Month", False),
        ("B", "The New New Product Development Game", True),
        ("C", "No Silver Bullet", False),
        ("D", "The Machine That Changed the World", False),
    ]),

    mcq(C, ["histoire", "scrum"],
        "Qui sont les co-créateurs de Scrum et auteurs du Scrum Guide ?", [
        ("A", "Kent Beck et Ward Cunningham", False),
        ("B", "Ken Schwaber et Jeff Sutherland", True),
        ("C", "Alistair Cockburn et Martin Fowler", False),
        ("D", "Eric Ries et Steve Blank", False),
    ]),

    mcq(C, ["pratiques", "xp"],
        "Quelle pratique est issue de l'eXtreme Programming plutôt que de Scrum ?", [
        ("A", "La Sprint Review", False),
        ("B", "Le développement piloté par les tests (TDD) et le pair programming", True),
        ("C", "Le Product Backlog", False),
        ("D", "La Definition of Done", False),
    ]),

    mcq(C, ["pratiques", "kanban"],
        "Que désigne une limite de WIP (Work In Progress) en Kanban ?", [
        ("A", "Le nombre maximum d'éléments traités simultanément à une étape donnée", True),
        ("B", "Le nombre de jours ouvrés d'un Sprint", False),
        ("C", "Le budget maximum d'une itération", False),
        ("D", "Le nombre de membres autorisés dans une équipe", False),
    ]),

    mcq(C, ["pratiques", "lean"],
        "De quelle entreprise le lean manufacturing, source d'inspiration de l'agilité, "
        "est-il issu ?", [
        ("A", "Ford", False), ("B", "Toyota", True),
        ("C", "General Electric", False), ("D", "Boeing", False),
    ]),

    mcq(C, ["pratiques", "metriques"],
        "Que mesure le « lead time » dans un flux de développement ?", [
        ("A", "Le temps entre la demande du client et sa livraison", True),
        ("B", "La durée d'un Sprint", False),
        ("C", "Le temps passé en réunion chaque semaine", False),
        ("D", "Le délai entre deux déploiements en production", False),
    ]),

    mcq(C, ["pratiques", "produit"],
        "Que désigne un MVP (Minimum Viable Product) ?", [
        ("A", "La version la moins coûteuse à développer", False),
        ("B", "La version la plus simple permettant d'apprendre auprès de vrais "
              "utilisateurs avec un minimum d'effort", True),
        ("C", "Le prototype présenté en interne avant le premier Sprint", False),
        ("D", "La première version certifiée sans défaut", False),
    ]),

    mcq(I, ["pratiques", "complexite"],
        "Le framework Cynefin classe les problèmes en domaines. Dans lequel Scrum "
        "est-il le plus adapté ?", [
        ("A", "Le domaine simple / évident", False),
        ("B", "Le domaine complexe, où les relations de cause à effet ne se comprennent "
              "qu'a posteriori", True),
        ("C", "Le domaine chaotique", False),
        ("D", "Le domaine compliqué, où les experts trouvent la bonne réponse", False),
    ]),
]

# ── Seeding ───────────────────────────────────────────────────────────────────

async def seed_psm1_bank() -> None:
    async with AsyncSessionLocal() as db:
        count_result = await db.execute(
            select(sqlfunc.count())
            .select_from(BankQuestion)
            .where(BankQuestion.exam_type == ExamTrack.psm1)
        )
        count = count_result.scalar() or 0
        if count > 0:
            print(f"La banque contient déjà {count} question(s) PSM I. Abandon.")
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
                exam_type=ExamTrack.psm1,
                tags=q_data["tags"],
                statement=q_data["statement"],
                points=q_data["points"],
                test_cases=None,
                created_by=admin.id,
            )
            db.add(q)
            await db.flush()

            for opt in q_data.get("options", []):
                db.add(BankMCQOption(question_id=q.id, **opt))

            key = q_data["difficulty"].value
            stats[key] = stats.get(key, 0) + 1

        await db.commit()

    print(f"✓ {len(QUESTIONS)} questions PSM I ajoutées à la banque :")
    labels = {
        "beginner": "Débutant",
        "intermediate": "Intermédiaire",
        "expert": "Expert",
        "culture": "Culture agile",
    }
    for level, label in labels.items():
        print(f"   {label:20s} : {stats.get(level, 0)}")


if __name__ == "__main__":
    asyncio.run(seed_psm1_bank())
