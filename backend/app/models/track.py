from enum import Enum as PyEnum


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


def track_of_tags(tags: list[str] | None) -> ExamTrack:
    tags = tags or []
    if "psm1" in tags or "scrum" in tags:
        return ExamTrack.psm1
    if "c" in tags:
        return ExamTrack.c
    if "algo-pack-v1" in tags or "algorithmes" in tags:
        return ExamTrack.algo
    return ExamTrack.python
