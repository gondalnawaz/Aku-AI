from dataclasses import dataclass

from typing import Any, List, Optional, Sequence, Tuple, Dict, NamedTuple

import math

import logging

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

ORIENTATION_POINT_MAPPINGS: List[List[int]] = [

    list(range(24)),

    list(reversed(range(24))),

    list(range(12, 24)) + list(range(0, 12)),

    list(reversed(list(range(12, 24)) + list(range(0, 12)))),

]

def renumber_points_by_orientation(points: List[Any], orientation_index: int) -> List[Any]:

    

    mapping = ORIENTATION_POINT_MAPPINGS[orientation_index]

    renamed: List[object] = []

    for standard_idx, raw_idx in enumerate(mapping, start=1):

        point = points[raw_idx].copy()

        point.id = standard_idx

        renamed.append(point)

    return renamed

@dataclass

class BoardState:

    

    white: List[int]

    black: List[int]

    bar_white: int = 0

    bar_black: int = 0

    borne_white: int = 0

    borne_black: int = 0

    def total_checkers(self) -> Tuple[int, int]:

        return (sum(self.white) + self.bar_white + self.borne_white,

                sum(self.black) + self.bar_black + self.borne_black)

    def copy(self) -> "BoardState":

        return BoardState(list(self.white), list(self.black),

                          self.bar_white, self.bar_black,

                          self.borne_white, self.borne_black)

class Move(NamedTuple):

    color: str

    src: Optional[int]

    dst: Optional[int]

    checker_count: int

    distance: int

    is_bearing_off: bool

def _permute_points(lst: List[int], mapping: List[int]) -> List[int]:

    return [lst[i] for i in mapping]

def generate_orientations(raw: BoardState) -> List[BoardState]:

    

    assert len(raw.white) == 24 and len(raw.black) == 24, "expected 24 points"

    identity_map = list(range(24))

    reverse_map = list(reversed(identity_map))

    rotate12_map = list(range(12, 24)) + list(range(0, 12))

    rotate12_reverse = list(reversed(rotate12_map))

    mappings = [identity_map, reverse_map, rotate12_map, rotate12_reverse]

    results: List[BoardState] = []

    for m in mappings:

        w = _permute_points(raw.white, m)

        b = _permute_points(raw.black, m)

        bs = BoardState(w, b, raw.bar_white, raw.bar_black,

                        raw.borne_white, raw.borne_black)

        results.append(bs)

    return results

def _signed_delta(a: List[int], b: List[int], idx: int) -> int:

    return b[idx] - a[idx]

def infer_moves_between_states(from_state: BoardState,

                               to_state: BoardState,

                               color: str) -> List[Move]:

    

    assert color in ("white", "black")

    src = from_state

    dst = to_state

    if color == "white":

        a = src.white

        b = dst.white

        bar_from = src.bar_white

        bar_to = dst.bar_white

    else:

        a = src.black

        b = dst.black

        bar_from = src.bar_black

        bar_to = dst.bar_black

    decreases: List[Tuple[int, int]] = []

    increases: List[Tuple[int, int]] = []

    for i in range(24):

        delta = b[i] - a[i]

        if delta < 0:

            decreases.append((i + 1, -delta))

        elif delta > 0:

            increases.append((i + 1, delta))

    moves: List[Move] = []

    bar_entries = 0

    if bar_from > bar_to:

        bar_entries = bar_from - bar_to

    entry_targets: List[int] = []

    if color == "white":

        entry_targets = [i for i in range(19, 25)]

    else:

        entry_targets = [i for i in range(1, 7)]

    flat_increases: List[int] = []

    for idx, cnt in increases:

        flat_increases.extend([idx] * cnt)

    for _ in range(bar_entries):

        chosen = None

        for t in entry_targets:

            if t in flat_increases:

                chosen = t

                flat_increases.remove(t)

                break

        if chosen is None and flat_increases:

            chosen = flat_increases.pop(0)

        if chosen is not None:

            moves.append(Move(color, None, chosen, 1, abs(chosen), False))

    flat_decreases: List[int] = []

    for idx, cnt in decreases:

        flat_decreases.extend([idx] * cnt)

    remaining_increases = list(flat_increases)

    while flat_decreases and remaining_increases:

        s = flat_decreases.pop(0)

        best_t = None

        best_score = math.inf

        for t in remaining_increases:

            dist = abs(s - t)

            dir_ok = (color == "white" and s > t) or (color == "black" and s < t)

            penalty = 0 if dir_ok else 10_000

            if dist + penalty < best_score:

                best_score = dist + penalty

                best_t = t

        if best_t is None:

            best_t = remaining_increases.pop(0)

        else:

            remaining_increases.remove(best_t)

        moves.append(Move(color, s, best_t, 1, abs(s - best_t), False))

    borne_increase = 0

    if color == "white":

        if dst.borne_white > src.borne_white:

            borne_increase = dst.borne_white - src.borne_white

    else:

        if dst.borne_black > src.borne_black:

            borne_increase = dst.borne_black - src.borne_black

    for _ in range(borne_increase):

        if flat_decreases:

            s = flat_decreases.pop(0)

            if color == "white":

                dist = s

            else:

                dist = 25 - s

            moves.append(Move(color, s, None, 1, dist, True))

    while flat_decreases:

        s = flat_decreases.pop(0)

        moves.append(Move(color, s, None, 1, 0, False))

    while remaining_increases:

        t = remaining_increases.pop(0)

        moves.append(Move(color, None, t, 1, 0, False))

    merged: Dict[Tuple[Optional[int], Optional[int]], Move] = {}

    for m in moves:

        key = (m.src, m.dst)

        if key in merged:

            old = merged[key]

            merged[key] = Move(m.color, m.src, m.dst, old.checker_count + m.checker_count, m.distance, m.is_bearing_off)

        else:

            merged[key] = m

    return list(merged.values())

class MoveScorer:

    

    W_DIRECTION_OK = 3.0

    W_DIRECTION_BAD = -50.0

    W_DICE_MATCH = 5.0

    W_DICE_SUM_MATCH = 2.0

    W_IMPOSSIBLE = -200.0

    W_BAR_ENTRY_OK = 10.0

    W_BAR_ENTRY_BAD = -50.0

    W_BEAR_OFF_OK = 10.0

    W_BEAR_OFF_BAD = -100.0

    W_HIT_OK = 8.0

    W_HIT_BAD = -20.0

    def __init__(self, dice: Optional[Tuple[int, int]] = None):

        self.dice = dice

    def score_transition(self,

                         from_state: BoardState,

                         to_state: BoardState) -> float:

        score = 0.0

        white_total_from, black_total_from = from_state.total_checkers()

        white_total_to, black_total_to = to_state.total_checkers()

        if white_total_to > 15 or black_total_to > 15:

            logger.debug("Impossible checker counts")

            return self.W_IMPOSSIBLE

        w_moves = infer_moves_between_states(from_state, to_state, "white")

        b_moves = infer_moves_between_states(from_state, to_state, "black")

        for m in w_moves + b_moves:

            if m.src is None or m.dst is None:

                dir_ok = True

            else:

                if m.color == "white":

                    dir_ok = (m.src > m.dst)

                else:

                    dir_ok = (m.src < m.dst)

            if dir_ok:

                score += self.W_DIRECTION_OK * m.checker_count

            else:

                score += self.W_DIRECTION_BAD * m.checker_count

            if self.dice and not m.is_bearing_off:

                d1, d2 = self.dice

                dist = m.distance

                if dist == d1 or dist == d2:

                    score += self.W_DICE_MATCH * m.checker_count

                elif dist == d1 + d2:

                    score += self.W_DICE_SUM_MATCH * m.checker_count

                else:

                    max_die = max(d1, d2)

                    if dist > max_die:

                        score += -1.0 * m.checker_count

        if from_state.bar_white > 0:

            non_bar_moves = [mv for mv in w_moves if mv.src is not None]

            if non_bar_moves and to_state.bar_white > 0:

                score += self.W_BAR_ENTRY_BAD

            else:

                score += self.W_BAR_ENTRY_OK

        if from_state.bar_black > 0:

            non_bar_moves = [mv for mv in b_moves if mv.src is not None]

            if non_bar_moves and to_state.bar_black > 0:

                score += self.W_BAR_ENTRY_BAD

            else:

                score += self.W_BAR_ENTRY_OK

        for color in ("white", "black"):

            moves = w_moves if color == "white" else b_moves

            for mv in moves:

                if mv.is_bearing_off:

                    if color == "white":

                        outside = sum(from_state.white[6:])

                    else:

                        outside = sum(from_state.black[:18])

                    if outside == 0:

                        score += self.W_BEAR_OFF_OK * mv.checker_count

                    else:

                        score += self.W_BEAR_OFF_BAD * mv.checker_count

        for i in range(24):

            dw = to_state.white[i] - from_state.white[i]

            db = to_state.black[i] - from_state.black[i]

            if db < 0 and to_state.bar_black > from_state.bar_black:

                score += self.W_HIT_OK

            if dw < 0 and to_state.bar_white > from_state.bar_white:

                score += self.W_HIT_OK

        if len(w_moves) > 4 or len(b_moves) > 4:

            score += self.W_IMPOSSIBLE

        return score

class OrientationSolver:

    

    def __init__(self):

        pass

    def score_orientations(self,

                           raw_states: List[BoardState],

                           dice_sequence: Optional[Sequence[Optional[Tuple[int, int]]]] = None

                           ) -> Tuple[Dict[int, float], int]:

        

        assert len(raw_states) >= 1

        if dice_sequence is None:

            dice_sequence = [None for _ in range(max(0, len(raw_states) - 1))]

        dice_sequence = list(dice_sequence)

        assert len(dice_sequence) == max(0, len(raw_states) - 1)

        orientation_scores: Dict[int, float] = {0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0}

        oriented_sequences: List[List[BoardState]] = []

        for idx in range(4):

            oriented_sequences.append([])

        for raw in raw_states:

            cands = generate_orientations(raw)

            for i, bs in enumerate(cands):

                oriented_sequences[i].append(bs)

        for i in range(4):

            seq = oriented_sequences[i]

            total = 0.0

            for t in range(len(seq) - 1):

                dice = dice_sequence[t]

                scorer = MoveScorer(dice)

                s = scorer.score_transition(seq[t], seq[t + 1])

                total += s

            orientation_scores[i] = total

        best_idx = max(orientation_scores.items(), key=lambda kv: kv[1])[0]

        return orientation_scores, best_idx

if __name__ == "__main__":

    empty = BoardState([0] * 24, [0] * 24)

    s1 = BoardState([0] * 24, [0] * 24)

    s1.white[12] = 1

    s2 = s1.copy()

    s2.white[12] -= 1

    s2.white[7] += 1

    solver = OrientationSolver()

    scores, best = solver.score_orientations([s1, s2], dice_sequence=[(5, 2)])

    print("scores:", scores)

    print("best orientation:", best)



