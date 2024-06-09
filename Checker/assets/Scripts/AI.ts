import { Vec2 } from "cc";
export class AI {
    type: string = "black";
    constructor(type: string) {
        this.type = type;
    }
    minimax(board: (string | null)[][], depth: number, max_player: boolean): [number, { from: Vec2, to: Vec2, board: (string | null) }] {
        if (depth == 0 || this.checkWin(board)) return [this.evaluate(board), null];

        if (max_player) {
            let maxEval = -Infinity;
            let best_move = null;
            const moves = this.getAllMoves(board);
            moves.forEach((move) => {
                const val = this.minimax(move.board, depth - 1, false)[0];
                maxEval = Math.max(maxEval, val);

                if (maxEval == val) {
                    best_move = move;
                }
            })

            return [maxEval, best_move];
        }

        let minEval = Infinity;
        let best_move = null;
        const moves = this.getAllMoves(board);
        moves.forEach((move) => {
            const val = this.minimax(move.board, depth - 1, true)[0];
            minEval = Math.min(minEval, val);

            if (minEval == val) {
                best_move = move;
            }

        })
        return [minEval, best_move];
    }

    evaluate(board: (string | null)[][]) {
        let black = 0;
        let red = 0;
        let redQ = 0;
        let blackQ = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] == "black") {
                    black++;
                } else if (board[i][j] == "red") {
                    red++;
                } else if (board[i][j] == "blackQ") {
                    blackQ++;
                } else if (board[i][j] == "redQ") {
                    redQ++;
                }
            }
        }

        if (this.type == "black") return black - red + 0.5 * (blackQ - redQ);

        return red - black + 0.5 * (redQ - blackQ);
    }

    getAllMoves(board: (string | null)[][]) {
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] && board[i][j].substring(0, 3) == this.type.substring(0, 3)) {
                    const validMoves = this.getValidMoves(board, j, i);
                    validMoves.forEach((value, key) => {
                        const copyBoard = board.map(row => [...row]);
                        const dest = JSON.parse(key);
                        const newBoard = this.simulateMove(copyBoard, value, j, i, dest.x, dest.y);
                        moves.push({
                            from: new Vec2(j, i),
                            to: new Vec2(dest.x, dest.y),
                            board: newBoard
                        })
                    })

                }
            }
        }

        return moves;
    }

    getValidMoves(board: (string | null)[][], x: number, y: number): Map<string, Vec2[]> {
        const validMoves = new Map<string, Vec2[]>();

        this.traverse(board, x, y, -1, 1, [], validMoves);
        this.traverse(board, x, y, 1, 1, [], validMoves);

        if (this.isQueen(board[y][x])) {
            this.traverse(board, x, y, -1, -1, [], validMoves);
            this.traverse(board, x, y, 1, -1, [], validMoves);
        }
        return validMoves;
    }

    isQueen(piece: string) {
        return piece[piece.length - 1] == 'Q';
    }

    traverse(board: (string | null)[][], x: number, y: number, stepX: number, stepY: number, skipped = [], validMoves: Map<string, Vec2[]>) {
        let newX = x + stepX;
        let newY = y + stepY;

        if (newX >= 0 && newY >= 0 && newX < 8 && newY < 8) {
            if (board[newY][newX] == null) {
                if (skipped.length == 0) {
                    const key = JSON.stringify(new Vec2(newX, newY));
                    validMoves.set(key, []);
                }
                else {
                    const key = JSON.stringify(new Vec2(x, y));
                    validMoves.set(key, [...skipped]);
                }
            } else if (board[newY][newX].substring(0, 3) != this.type) {
                newX += stepX;
                newY += stepY;
                if (newX >= 0 && newY >= 0 && newX < 8 && newY < 8 && board[newY][newX] == null) {
                    skipped.push(new Vec2(newX - stepX, newY - stepY));
                    this.traverse(board, newX, newY, -stepX, stepY, [...skipped], validMoves);
                    this.traverse(board, newX, newY, stepX, stepY, [...skipped], validMoves);
                } else if (skipped.length > 0) {
                    const key = JSON.stringify(new Vec2(x, y));
                    validMoves.set(key, [...skipped]);
                }
            } else if (skipped.length > 0) {
                const key = JSON.stringify(new Vec2(x, y));
                validMoves.set(key, [...skipped]);
            }
        } else if (skipped.length > 0) {
            const key = JSON.stringify(new Vec2(x, y));
            validMoves.set(key, [...skipped]);
        }
    }

    simulateMove(board: (string | null)[][], skipped: Vec2[], x: number, y: number, newX: number, newY: number) {
        board[newY][newX] = board[y][x];
        board[y][x] = null;

        if (newY == 7) board[newY][newX] = this.type + "Q";

        skipped.forEach((piece) => {
            board[piece.y][piece.x] = null;
        })

        return board;
    }

    countLeftMoves(board: (string | null)[][], type: string) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] && board[i][j].substring(0, 3) == type.substring(0, 3)) {
                    const validMoves = this.getValidMoves(board, j, i);
                    if (validMoves.size > 0) return true;
                }
            }
        }

        return false;
    }

    checkWin(board: (string | null)[][]) {
        let black = 0;
        let red = 0;
        let redQ = 0;
        let blackQ = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] == "black") {
                    black++;
                } else if (board[i][j] == "red") {
                    red++;
                } else if (board[i][j] == "blackQ") {
                    blackQ++;
                } else if (board[i][j] == "redQ") {
                    redQ++;
                }
            }
        }

        if (black + blackQ == 0 || red + redQ == 0) return true;
        return false;
    }
}