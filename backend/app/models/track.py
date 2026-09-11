from enum import Enum as PyEnum


class ExamKind(str, PyEnum):
    """An exam is sat once under invigilation; an exercise is practised freely."""

    exam = "exam"
    exercise = "exercise"


class ExamTrack(str, PyEnum):
    python = "python"
    c = "c"
    algo = "algo"
    psm1 = "psm1"


TRACK_LABELS: dict[ExamTrack, str] = {
    ExamTrack.python: "Python",
    ExamTrack.c: "C",
    ExamTrack.algo: "Algorithmique",
    ExamTrack.psm1: "PSM I — Professional Scrum Master",
}

MCQ_ONLY_TRACKS: frozenset[ExamTrack] = frozenset({ExamTrack.psm1})

# Practice sessions run shorter than the real thing.
DEFAULT_EXERCISE_MINUTES = 45

# Marker tags used to file questions, not themes a student can revise.
NON_THEME_TAGS: frozenset[str] = frozenset(
    {"psm1", "scrum", "c", "algo-pack-v1", "python"}
)


class MockFormat:
    """The shape of the real certification, so a mock exam feels like it."""

    def __init__(self, n_mcq: int, n_coding: int, minutes: int, pass_pct: float):
        self.n_mcq = n_mcq
        self.n_coding = n_coding
        self.minutes = minutes
        self.pass_pct = pass_pct


# PSM I is the one with a published format: 80 questions, 60 minutes, 85%.
MOCK_FORMATS: dict[ExamTrack, MockFormat] = {
    ExamTrack.psm1: MockFormat(n_mcq=80, n_coding=0, minutes=60, pass_pct=85.0),
    ExamTrack.python: MockFormat(n_mcq=40, n_coding=2, minutes=90, pass_pct=70.0),
    ExamTrack.c: MockFormat(n_mcq=40, n_coding=2, minutes=90, pass_pct=70.0),
    ExamTrack.algo: MockFormat(n_mcq=0, n_coding=5, minutes=90, pass_pct=70.0),
}


def track_of_tags(tags: list[str] | None) -> ExamTrack:
    tags = tags or []
    if "psm1" in tags or "scrum" in tags:
        return ExamTrack.psm1
    if "c" in tags:
        return ExamTrack.c
    if "algo-pack-v1" in tags or "algorithmes" in tags:
        return ExamTrack.algo
    return ExamTrack.python
