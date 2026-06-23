// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, RotateCcw } from 'lucide-react';
import { useLang } from '@/lib/useLang';
import { t } from '@/lib/i18n';
const POINT_NUMBERS = Array.from({ length: 24 }, (_, index) => index + 1);
function clampCount(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0)
        return 0;
    return parsed;
}
function normalizePoint(point) {
    return {
        white: clampCount(point?.white),
        black: clampCount(point?.black),
    };
}
function normalizeFrame(frame = {}, fallbackTurn = 1) {
    const normalizedPoints = {};
    for (const pointNumber of POINT_NUMBERS) {
        normalizedPoints[String(pointNumber)] = normalizePoint(frame?.points?.[String(pointNumber)]);
    }
    const diceValues = Array.isArray(frame?.dice) ? frame.dice.slice(0, 2) : [];
    return {
        turn: clampCount(frame?.turn) || fallbackTurn,
        player: frame?.player === 'white' || frame?.player === 'black' ? frame.player : '',
        cube: clampCount(frame?.cube) || 1,
        dice: diceValues.map((die) => clampCount(die)).filter((die) => die > 0),
        points: normalizedPoints,
        bar: normalizePoint(frame?.bar),
        borne_off: normalizePoint(frame?.borne_off),
    };
}
function cloneFrame(frame) {
    return JSON.parse(JSON.stringify(frame));
}
function getFrameTotals(frame) {
    const totals = { white: 0, black: 0 };
    for (const pointNumber of POINT_NUMBERS) {
        const point = frame?.points?.[String(pointNumber)] || { white: 0, black: 0 };
        totals.white += clampCount(point.white);
        totals.black += clampCount(point.black);
    }
    totals.white += clampCount(frame?.bar?.white) + clampCount(frame?.borne_off?.white);
    totals.black += clampCount(frame?.bar?.black) + clampCount(frame?.borne_off?.black);
    return totals;
}
function getFrameWarnings(frame) {
    const warnings = [];
    const totals = getFrameTotals(frame);
    if (totals.white !== 15)
        warnings.push(`White has ${totals.white} checkers total.`);
    if (totals.black !== 15)
        warnings.push(`Black has ${totals.black} checkers total.`);
    const dice = Array.isArray(frame?.dice) ? frame.dice : [];
    if (dice.some((value) => value < 1 || value > 6)) {
        warnings.push('Dice values must be between 1 and 6.');
    }
    return warnings;
}
function drawWoodTray(ctx, x, y, width, height) {
    ctx.fillStyle = '#7f4b2d';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#4e2b15';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, '#a96641');
    gradient.addColorStop(0.5, '#8a5332');
    gradient.addColorStop(1, '#b8744d');
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
}
function drawChecker(ctx, x, y, radius, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const fill = color === 'white' ? '#f5f7fb' : '#26282d';
    const stroke = color === 'white' ? '#333333' : '#646b78';
    const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 5, x, y, radius);
    if (color === 'white') {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.65, '#f0f3f8');
        gradient.addColorStop(1, '#ccd4df');
    }
    else {
        gradient.addColorStop(0, '#51545b');
        gradient.addColorStop(0.6, '#22252b');
        gradient.addColorStop(1, '#0d1015');
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - radius / 3, y - radius / 3, radius / 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color === 'white' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.14)';
    ctx.fill();
    ctx.restore();
}
function drawDie(ctx, x, y, value) {
    const size = 52;
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#d9dee8');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#97a1b1';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x + 4, y + 4, size - 8, 10);
    const pipRadius = 4.5;
    const left = x + 12;
    const center = x + size / 2;
    const right = x + size - 12;
    const top = y + 12;
    const middle = y + size / 2;
    const bottom = y + size - 12;
    const pipMap = {
        1: [[center, middle]],
        2: [[left, top], [right, bottom]],
        3: [[left, top], [center, middle], [right, bottom]],
        4: [[left, top], [right, top], [left, bottom], [right, bottom]],
        5: [[left, top], [right, top], [center, middle], [left, bottom], [right, bottom]],
        6: [[left, top], [right, top], [left, middle], [right, middle], [left, bottom], [right, bottom]],
    };
    ctx.fillStyle = '#243447';
    for (const [px, py] of pipMap[value] || []) {
        ctx.beginPath();
        ctx.arc(px, py, pipRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}
function drawCube(ctx, x, y, value) {
    const size = 40;
    const gradient = ctx.createLinearGradient(x - size / 2, y - size / 2, x + size / 2, y + size / 2);
    gradient.addColorStop(0, '#fce38a');
    gradient.addColorStop(1, '#dbb84b');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.strokeStyle = '#9b7517';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x - size / 2 + 4, y - size / 2 + 4, size - 8, 9);
    ctx.fillStyle = '#4f3d10';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value === 1 ? 'G' : value), x, y + 1);
}
function getMovedIncrements(previousFrame, currentFrame) {
    const increments = {
        points: Object.fromEntries(POINT_NUMBERS.map((pointNumber) => [String(pointNumber), { white: 0, black: 0 }])),
        bar: { white: 0, black: 0 },
        borne_off: { white: 0, black: 0 },
    };
    if (!previousFrame || !currentFrame)
        return increments;
    for (const pointNumber of POINT_NUMBERS) {
        const key = String(pointNumber);
        const previousPoint = normalizePoint(previousFrame?.points?.[key]);
        const currentPoint = normalizePoint(currentFrame?.points?.[key]);
        increments.points[key] = {
            white: Math.max(0, currentPoint.white - previousPoint.white),
            black: Math.max(0, currentPoint.black - previousPoint.black),
        };
    }
    const previousBar = normalizePoint(previousFrame?.bar);
    const currentBar = normalizePoint(currentFrame?.bar);
    increments.bar = {
        white: Math.max(0, currentBar.white - previousBar.white),
        black: Math.max(0, currentBar.black - previousBar.black),
    };
    const previousBorneOff = normalizePoint(previousFrame?.borne_off);
    const currentBorneOff = normalizePoint(currentFrame?.borne_off);
    increments.borne_off = {
        white: Math.max(0, currentBorneOff.white - previousBorneOff.white),
        black: Math.max(0, currentBorneOff.black - previousBorneOff.black),
    };
    return increments;
}
function getMovedDecrements(previousFrame, currentFrame) {
    const decrements = {
        points: Object.fromEntries(POINT_NUMBERS.map((pointNumber) => [String(pointNumber), { white: 0, black: 0 }])),
        bar: { white: 0, black: 0 },
        borne_off: { white: 0, black: 0 },
    };
    if (!previousFrame || !currentFrame)
        return decrements;
    for (const pointNumber of POINT_NUMBERS) {
        const key = String(pointNumber);
        const previousPoint = normalizePoint(previousFrame?.points?.[key]);
        const currentPoint = normalizePoint(currentFrame?.points?.[key]);
        decrements.points[key] = {
            white: Math.max(0, previousPoint.white - currentPoint.white),
            black: Math.max(0, previousPoint.black - currentPoint.black),
        };
    }
    const previousBar = normalizePoint(previousFrame?.bar);
    const currentBar = normalizePoint(currentFrame?.bar);
    decrements.bar = {
        white: Math.max(0, previousBar.white - currentBar.white),
        black: Math.max(0, previousBar.black - currentBar.black),
    };
    const previousBorneOff = normalizePoint(previousFrame?.borne_off);
    const currentBorneOff = normalizePoint(currentFrame?.borne_off);
    decrements.borne_off = {
        white: Math.max(0, previousBorneOff.white - currentBorneOff.white),
        black: Math.max(0, previousBorneOff.black - currentBorneOff.black),
    };
    return decrements;
}
function drawMovedHighlight(ctx, x, y, radius, color, kind = 'to') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    if (kind === 'from') {
        ctx.strokeStyle = color === 'white' ? '#ef4444' : '#fb7185';
        ctx.shadowColor = color === 'white' ? 'rgba(239,68,68,0.65)' : 'rgba(251,113,133,0.65)';
    }
    else {
        ctx.strokeStyle = color === 'white' ? '#38bd38' : '#f59e0b';
        ctx.shadowColor = color === 'white' ? 'rgba(56,189,248,0.65)' : 'rgba(245,158,11,0.65)';
    }
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();
}
export default function BoardCanvas({ job, compact = false }) {
    const { lang } = useLang();
    const canvasRef = useRef(null);
    const [frames, setFrames] = useState([]);
    const [originalFrames, setOriginalFrames] = useState([]);
    const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sourceData, setSourceData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setErrorMessage('');
            try {
                if (!job?.result_url) {
                    if (mounted) {
                        setFrames([]);
                        setOriginalFrames([]);
                        setSourceData(null);
                    }
                    return;
                }
                const res = await fetch(job.result_url);
                if (!res.ok)
                    throw new Error(`Unable to fetch result: ${res.status}`);
                const data = await res.json();
                const loadedFrames = Array.isArray(data?.frames)
                    ? data.frames.map((frame, index) => normalizeFrame(frame, index + 1))
                    : [];
                if (!mounted)
                    return;
                setFrames(loadedFrames);
                setOriginalFrames(loadedFrames.map((frame) => cloneFrame(frame)));
                setSourceData(data);
                setCurrentFrameIdx(0);
            }
            catch (error) {
                console.error('Failed to load board result:', error);
                if (mounted) {
                    setFrames([]);
                    setOriginalFrames([]);
                    setSourceData(null);
                    setErrorMessage('Failed to load the board data for this job.');
                }
            }
            finally {
                if (mounted)
                    setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [job]);
    const currentFrame = frames[currentFrameIdx] || null;
    const previousFrame = currentFrameIdx > 0 ? frames[currentFrameIdx - 1] : currentFrame;
    const currentWarnings = useMemo(() => (currentFrame ? getFrameWarnings(currentFrame) : []), [currentFrame]);
    const currentTotals = useMemo(() => (currentFrame ? getFrameTotals(currentFrame) : { white: 0, black: 0 }), [currentFrame]);
    const movedIncrements = useMemo(() => getMovedIncrements(previousFrame, currentFrame), [previousFrame, currentFrame]);
    const movedDecrements = useMemo(() => getMovedDecrements(previousFrame, currentFrame), [previousFrame, currentFrame]);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !currentFrame)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const dpr = window.devicePixelRatio || 1;
        const cw = 1000;
        const ch = 580;
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#070d1a';
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = '#5b3a24';
        ctx.fillRect(70, 40, cw - 140, ch - 80);
        const pointW = (cw - 200) / 12;
        const pointHeight = (ch - 80) / 2;
        const topY = 40;
        const bottomY = ch - 40;
        const barX = cw / 2;
        const boardLeft = 70;
        const boardRightStart = barX + 30;
        const checkerRadius = pointW / 3;
        const drawPoint = (x, pointNum, isTop) => {
            ctx.beginPath();
            if (isTop) {
                ctx.moveTo(x + pointW / 2, topY + pointHeight - 8);
                ctx.lineTo(x + 8, topY);
                ctx.lineTo(x + pointW - 8, topY);
            }
            else {
                ctx.moveTo(x + pointW / 2, bottomY - pointHeight + 8);
                ctx.lineTo(x + 8, bottomY);
                ctx.lineTo(x + pointW - 8, bottomY);
            }
            ctx.closePath();
            ctx.fillStyle = (pointNum - 1) % 2 === 0 ? '#7295de' : '#152b5a';
            ctx.fill();
            ctx.fillStyle = '#b7cde0';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(pointNum), x + pointW / 2, isTop ? topY - 16 : bottomY + 16);
        };
        for (let i = 0; i < 6; i++)
            drawPoint(boardRightStart + i * pointW, 6 - i, false);
        for (let i = 0; i < 6; i++)
            drawPoint(boardLeft + i * pointW, 12 - i, false);
        for (let i = 0; i < 6; i++)
            drawPoint(boardLeft + i * pointW, 13 + i, true);
        for (let i = 0; i < 6; i++)
            drawPoint(boardRightStart + i * pointW, 19 + i, true);
        ctx.fillStyle = '#7f4b2d';
        ctx.fillRect(barX - 15, 40, 30, ch - 80);
        ctx.strokeStyle = '#4e2b15';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 15, 40, 30, ch - 80);
        const trayWidth = 50;
        drawWoodTray(ctx, 10, 80, trayWidth, ch - 160);
        drawWoodTray(ctx, cw - 60, 80, trayWidth, ch - 160);
        ctx.fillStyle = '#e3d2a5';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t('board_off', lang), 35, 70);
        ctx.fillText(t('board_off', lang), cw - 35, 70);
        const pointPositions = {
            1: { x: boardRightStart + 5 * pointW + pointW / 2, top: false },
            2: { x: boardRightStart + 4 * pointW + pointW / 2, top: false },
            3: { x: boardRightStart + 3 * pointW + pointW / 2, top: false },
            4: { x: boardRightStart + 2 * pointW + pointW / 2, top: false },
            5: { x: boardRightStart + 1 * pointW + pointW / 2, top: false },
            6: { x: boardRightStart + 0 * pointW + pointW / 2, top: false },
            7: { x: boardLeft + 5 * pointW + pointW / 2, top: false },
            8: { x: boardLeft + 4 * pointW + pointW / 2, top: false },
            9: { x: boardLeft + 3 * pointW + pointW / 2, top: false },
            10: { x: boardLeft + 2 * pointW + pointW / 2, top: false },
            11: { x: boardLeft + 1 * pointW + pointW / 2, top: false },
            12: { x: boardLeft + 0 * pointW + pointW / 2, top: false },
            13: { x: boardLeft + 0 * pointW + pointW / 2, top: true },
            14: { x: boardLeft + 1 * pointW + pointW / 2, top: true },
            15: { x: boardLeft + 2 * pointW + pointW / 2, top: true },
            16: { x: boardLeft + 3 * pointW + pointW / 2, top: true },
            17: { x: boardLeft + 4 * pointW + pointW / 2, top: true },
            18: { x: boardLeft + 5 * pointW + pointW / 2, top: true },
            19: { x: boardRightStart + 0 * pointW + pointW / 2, top: true },
            20: { x: boardRightStart + 1 * pointW + pointW / 2, top: true },
            21: { x: boardRightStart + 2 * pointW + pointW / 2, top: true },
            22: { x: boardRightStart + 3 * pointW + pointW / 2, top: true },
            23: { x: boardRightStart + 4 * pointW + pointW / 2, top: true },
            24: { x: boardRightStart + 5 * pointW + pointW / 2, top: true },
        };
        const renderPointCheckers = (sourceFrame, alpha, moveDelta, highlightKind = 'to') => {
            if (!sourceFrame)
                return;
            const sourcePoints = sourceFrame.points || {};
            for (const pointNumber of POINT_NUMBERS) {
                const key = String(pointNumber);
                const point = sourcePoints[key] || { white: 0, black: 0 };
                const position = pointPositions[pointNumber];
                const whiteCount = clampCount(point.white);
                const blackCount = clampCount(point.black);
                const movedWhite = clampCount(moveDelta?.points?.[key]?.white);
                const movedBlack = clampCount(moveDelta?.points?.[key]?.black);
                const movedWhiteStart = Math.max(0, whiteCount - movedWhite);
                const movedBlackStart = Math.max(0, blackCount - movedBlack);
                for (let i = 0; i < whiteCount; i++) {
                    const offset = position.top ? i * pointW * 0.68 : -i * pointW * 0.68;
                    const y = position.top ? topY + checkerRadius + offset : bottomY - checkerRadius + offset;
                    drawChecker(ctx, position.x, y, checkerRadius, 'white', alpha);
                    if (movedWhite > 0 && i >= movedWhiteStart) {
                        drawMovedHighlight(ctx, position.x, y, checkerRadius, 'white', highlightKind);
                    }
                }
                for (let i = 0; i < blackCount; i++) {
                    const offset = position.top ? i * pointW * 0.68 : -i * pointW * 0.68;
                    const y = position.top ? topY + checkerRadius + offset : bottomY - checkerRadius + offset;
                    drawChecker(ctx, position.x, y, checkerRadius, 'black', alpha);
                    if (movedBlack > 0 && i >= movedBlackStart) {
                        drawMovedHighlight(ctx, position.x, y, checkerRadius, 'black', highlightKind);
                    }
                }
            }
        };
        renderPointCheckers(previousFrame, currentFrameIdx > 0 ? 0.3 : 1, currentFrameIdx > 0 ? movedDecrements : null, 'from');
        renderPointCheckers(currentFrame, 1, movedIncrements, 'to');
        const previousBar = previousFrame?.bar || { white: 0, black: 0 };
        const bar = currentFrame?.bar || { white: 0, black: 0 };
        const previousBarWhiteCount = clampCount(previousBar.white);
        const previousBarBlackCount = clampCount(previousBar.black);
        const barWhiteCount = clampCount(bar.white);
        const barBlackCount = clampCount(bar.black);
        const movedFromBarWhite = clampCount(movedDecrements?.bar?.white);
        const movedFromBarBlack = clampCount(movedDecrements?.bar?.black);
        const movedBarWhite = clampCount(movedIncrements?.bar?.white);
        const movedBarBlack = clampCount(movedIncrements?.bar?.black);
        const movedFromBarWhiteStart = Math.max(0, previousBarWhiteCount - movedFromBarWhite);
        const movedFromBarBlackStart = Math.max(0, previousBarBlackCount - movedFromBarBlack);
        const movedBarWhiteStart = Math.max(0, barWhiteCount - movedBarWhite);
        const movedBarBlackStart = Math.max(0, barBlackCount - movedBarBlack);
        if (currentFrameIdx > 0) {
            for (let i = 0; i < previousBarWhiteCount; i++) {
                const x = barX;
                const y = ch / 2 - 72 + i * 22;
                drawChecker(ctx, x, y, checkerRadius, 'white', 0.3);
                if (movedFromBarWhite > 0 && i >= movedFromBarWhiteStart) {
                    drawMovedHighlight(ctx, x, y, checkerRadius, 'white', 'from');
                }
            }
            for (let i = 0; i < previousBarBlackCount; i++) {
                const x = barX;
                const y = ch / 2 + 72 - i * 22;
                drawChecker(ctx, x, y, checkerRadius, 'black', 0.3);
                if (movedFromBarBlack > 0 && i >= movedFromBarBlackStart) {
                    drawMovedHighlight(ctx, x, y, checkerRadius, 'black', 'from');
                }
            }
        }
        for (let i = 0; i < barWhiteCount; i++) {
            const x = barX;
            const y = ch / 2 - 72 + i * 22;
            drawChecker(ctx, x, y, checkerRadius, 'white');
            if (movedBarWhite > 0 && i >= movedBarWhiteStart) {
                drawMovedHighlight(ctx, x, y, checkerRadius, 'white', 'to');
            }
        }
        for (let i = 0; i < barBlackCount; i++) {
            const x = barX;
            const y = ch / 2 + 72 - i * 22;
            drawChecker(ctx, x, y, checkerRadius, 'black');
            if (movedBarBlack > 0 && i >= movedBarBlackStart) {
                drawMovedHighlight(ctx, x, y, checkerRadius, 'black', 'to');
            }
        }
        const whiteBorneOff = clampCount(currentFrame?.borne_off?.white);
        const blackBorneOff = clampCount(currentFrame?.borne_off?.black);
        const visibleWhiteBorneOff = Math.min(whiteBorneOff, 6);
        const visibleBlackBorneOff = Math.min(blackBorneOff, 6);
        const movedWhiteBorneOff = Math.min(clampCount(movedIncrements?.borne_off?.white), visibleWhiteBorneOff);
        const movedBlackBorneOff = Math.min(clampCount(movedIncrements?.borne_off?.black), visibleBlackBorneOff);
        const movedWhiteBorneOffStart = Math.max(0, visibleWhiteBorneOff - movedWhiteBorneOff);
        const movedBlackBorneOffStart = Math.max(0, visibleBlackBorneOff - movedBlackBorneOff);
        for (let i = 0; i < visibleWhiteBorneOff; i++) {
            const x = 35;
            const y = ch - 105 - i * checkerRadius;
            drawChecker(ctx, x, y, checkerRadius * 0.85, 'white');
            if (movedWhiteBorneOff > 0 && i >= movedWhiteBorneOffStart) {
                drawMovedHighlight(ctx, x, y, checkerRadius * 0.85, 'white');
            }
        }
        for (let i = 0; i < visibleBlackBorneOff; i++) {
            const x = cw - 35;
            const y = ch - 105 - i * checkerRadius;
            drawChecker(ctx, x, y, checkerRadius * 0.85, 'black');
            if (movedBlackBorneOff > 0 && i >= movedBlackBorneOffStart) {
                drawMovedHighlight(ctx, x, y, checkerRadius * 0.85, 'black');
            }
        }
        ctx.fillStyle = '#e3d2a5';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`W:${whiteBorneOff}`, 35, ch - 65);
        ctx.fillText(`B:${blackBorneOff}`, cw - 35, ch - 65);
        const diceValues = currentFrame?.dice || [];
        const diceX = currentFrame?.player === 'black' ? cw / 6 : (cw * 4) / 6;
        if (diceValues[0])
            drawDie(ctx, diceX, ch / 2 - 30, diceValues[0]);
        if (diceValues[1])
            drawDie(ctx, diceX + 70, ch / 2 - 30, diceValues[1]);
        drawCube(ctx, 35, ch / 2, currentFrame?.cube || 1);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentFrame?.player
            ? t('board_to_play', lang).replace('{player}', currentFrame.player.toUpperCase())
            : t('board_player_not_set', lang), cw / 2, ch - 12);
    }, [currentFrame, previousFrame, currentFrameIdx, movedIncrements, movedDecrements, lang]);
    const updateCurrentFrame = (updater) => {
        setFrames((prevFrames) => {
            if (!prevFrames[currentFrameIdx])
                return prevFrames;
            const nextFrames = prevFrames.map((frame) => cloneFrame(frame));
            nextFrames[currentFrameIdx] = updater(nextFrames[currentFrameIdx]);
            return nextFrames;
        });
    };
    const handleMetaChange = (field, value) => {
        updateCurrentFrame((frame) => {
            if (field === 'player') {
                frame.player = value;
                return frame;
            }
            if (field === 'cube' || field === 'turn') {
                frame[field] = clampCount(value) || (field === 'cube' ? 1 : frame[field]);
            }
            return frame;
        });
    };
    const handleDiceChange = (index, value) => {
        updateCurrentFrame((frame) => {
            const dice = Array.isArray(frame.dice) ? [...frame.dice] : [];
            const numericValue = clampCount(value);
            if (!numericValue)
                dice[index] = undefined;
            else
                dice[index] = Math.min(6, numericValue);
            frame.dice = dice.filter(Boolean);
            return frame;
        });
    };
    const handlePointChange = (pointNumber, color, value) => {
        updateCurrentFrame((frame) => {
            frame.points[String(pointNumber)][color] = clampCount(value);
            return frame;
        });
    };
    const handleAreaChange = (area, color, value) => {
        updateCurrentFrame((frame) => {
            frame[area][color] = clampCount(value);
            return frame;
        });
    };
    const handleResetFrame = () => {
        setFrames((prevFrames) => {
            if (!originalFrames[currentFrameIdx])
                return prevFrames;
            const nextFrames = prevFrames.map((frame) => cloneFrame(frame));
            nextFrames[currentFrameIdx] = cloneFrame(originalFrames[currentFrameIdx]);
            return nextFrames;
        });
    };
    const handleApplyToNextFrame = () => {
        if (currentFrameIdx >= frames.length - 1 || !currentFrame)
            return;
        setFrames((prevFrames) => {
            const nextFrames = prevFrames.map((frame) => cloneFrame(frame));
            nextFrames[currentFrameIdx + 1] = cloneFrame(nextFrames[currentFrameIdx]);
            nextFrames[currentFrameIdx + 1].turn = currentFrameIdx + 2;
            return nextFrames;
        });
    };
    const handleDownloadEdited = () => {
        const payload = {
            ...(sourceData || {}),
            frames,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${job?.file_name || 'board-state'}-edited.json`;
        link.click();
        URL.revokeObjectURL(url);
    };
    const handlePrev = () => {
        setCurrentFrameIdx((prev) => Math.max(0, prev - 1));
    };
    const handleNext = () => {
        setCurrentFrameIdx((prev) => Math.min(frames.length - 1, prev + 1));
    };
    return (<div className="flex flex-col gap-4">
      <div className="w-full bg-black rounded-lg overflow-hidden border border-white/10">
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }}/>
      </div>

      {frames.length > 0 && (<>
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={handlePrev} disabled={currentFrameIdx === 0} className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded">
                <ChevronLeft className="w-4 h-4 text-white"/>
              </button>
              <div className="text-sm text-white/70">
                {t('board_move', lang)} <span className="text-white font-semibold">{currentFrameIdx + 1}</span> / {frames.length}
              </div>
              <button type="button" onClick={handleNext} disabled={currentFrameIdx === frames.length - 1} className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded">
                <ChevronRight className="w-4 h-4 text-white"/>
              </button>
            </div>

            {!compact && (<div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleResetFrame} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm">
                  <RotateCcw className="w-4 h-4"/>
                  {t('board_reset_move', lang)}
                </button>
                
                <button type="button" onClick={handleDownloadEdited} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 text-sm">
                  <Download className="w-4 h-4"/>
                  {t('board_download_json', lang)}
                </button>
              </div>)}
          </div>

          {!compact && (<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-white font-semibold">{t('board_current_editor', lang)}</h3>
                <p className="text-sm text-white/55">{t('board_editor_sub', lang)}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="rounded-xl bg-white/5 px-3 py-2 text-white/75">{t('board_white_total', lang)}: <span className={`font-semibold ${currentTotals.white === 15 ? 'text-green-400' : 'text-yellow-300'}`}>{currentTotals.white}</span></div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-white/75">{t('board_black_total', lang)}: <span className={`font-semibold ${currentTotals.black === 15 ? 'text-green-400' : 'text-yellow-300'}`}>{currentTotals.black}</span></div>
              </div>
            </div>

            {currentWarnings.length > 0 && (<div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                <div className="font-semibold mb-1">{t('board_validation_notes', lang)}</div>
                <ul className="list-disc pl-5 space-y-1">
                  {currentWarnings.map((warning) => (<li key={warning}>{warning}</li>))}
                </ul>
              </div>)}

            <div className="mt-5 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5">
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="max-h-[600px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-950/95 backdrop-blur">
                      <tr className="text-left text-white/60 border-b border-white/10">
                        <th className="px-4 py-3">{t('board_point', lang)}</th>
                        <th className="px-4 py-3">{t('board_white', lang)}</th>
                        <th className="px-4 py-3">{t('board_black', lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {POINT_NUMBERS.map((pointNumber) => {
                    const point = currentFrame?.points?.[String(pointNumber)] || { white: 0, black: 0 };
                    return (<tr key={pointNumber} className="border-b border-white/5 text-white/85">
                            <td className="px-4 py-1 font-medium">{pointNumber}</td>
                            <td className="px-4 py-1">
                              <input type="number" min="0" value={point.white} onChange={(event) => handlePointChange(pointNumber, 'white', event.target.value)} className="w-14 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-gold/50"/>
                            </td>
                            <td className="px-4 py-1">
                              <input type="number" min="0" value={point.black} onChange={(event) => handlePointChange(pointNumber, 'black', event.target.value)} className="w-14 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-gold/50"/>
                            </td>
                          </tr>);
                })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-medium mb-3">{t('board_meta', lang)}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm text-white/70">
                      <span className="block mb-1.5">{t('board_turn', lang)}</span>
                      <input type="number" min="1" value={currentFrame?.turn ?? 1} onChange={(event) => handleMetaChange('turn', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-gold/50"/>
                    </label>
                    <label className="text-sm text-white/70">
                      <span className="block mb-1.5">{t('board_cube', lang)}</span>
                      <input type="number" min="1" value={currentFrame?.cube ?? 1} onChange={(event) => handleMetaChange('cube', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-gold/50"/>
                    </label>
                    <label className="text-sm text-white/70 col-span-2">
                      <span className="block mb-1.5">{t('board_player_to_move', lang)}</span>
                      <select value={currentFrame?.player ?? ''} onChange={(event) => handleMetaChange('player', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-gold/50">
                        <option value="">{t('board_not_set', lang)}</option>
                        <option value="white">{t('board_white', lang)}</option>
                        <option value="black">{t('board_black', lang)}</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-medium mb-3">{t('board_dice', lang)}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1].map((index) => (<label key={index} className="text-sm text-white/70">
                        <span className="block mb-1.5">{t('board_die', lang)} {index + 1}</span>
                        <select value={currentFrame?.dice?.[index] ?? ''} onChange={(event) => handleDiceChange(index, event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-gold/50">
                          <option value="">{t('board_empty', lang)}</option>
                          {[1, 2, 3, 4, 5, 6].map((value) => (<option key={value} value={value}>{value}</option>))}
                        </select>
                      </label>))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-medium mb-3">{t('board_special_areas', lang)}</h4>
                  <div className="overflow-hidden rounded-lg border border-white/10">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-950/70 text-white/60">
                        <tr>
                          <th className="px-2 py-2 text-left">{t('board_area', lang)}</th>
                          <th className="px-2 py-2 text-left">{t('board_white', lang)}</th>
                          <th className="px-2 py-2 text-left">{t('board_black', lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                    { key: 'bar', label: t('board_bar', lang) },
                    { key: 'borne_off', label: t('board_borne_off', lang) },
                ].map((area) => (<tr key={area.key} className="border-t border-white/10 text-white/85">
                            <td className="px-2 py-2.5 font-medium">{area.label}</td>
                            <td className="px-2 py-2.5">
                              <input type="number" min="0" value={currentFrame?.[area.key]?.white ?? 0} onChange={(event) => handleAreaChange(area.key, 'white', event.target.value)} className="w-20 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-gold/50"/>
                            </td>
                            <td className="px-2 py-2.5">
                              <input type="number" min="0" value={currentFrame?.[area.key]?.black ?? 0} onChange={(event) => handleAreaChange(area.key, 'black', event.target.value)} className="w-20 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-gold/50"/>
                            </td>
                          </tr>))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            </div>)}
        </>)}

      {loading && <div className="text-center text-white/60 text-sm">{t('board_loading_state', lang)}</div>}
      {errorMessage && !loading && <div className="text-center text-red-300 text-sm">{errorMessage}</div>}
      {frames.length === 0 && !loading && !errorMessage && <div className="text-center text-white/60 text-sm">{t('board_no_moves', lang)}</div>}
    </div>);
}
