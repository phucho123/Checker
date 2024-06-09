import { _decorator, Button, Component, director, GraphicsComponent, instantiate, Node, Prefab, resources, Socket, Sprite, SpriteComponent, SpriteFrame, tween, UITransform, Vec2, Vec3 } from 'cc';
import { AI } from './AI';
import { GlobalVariables } from './constant';
const { ccclass, property } = _decorator;

@ccclass('Board')
export class Board extends Component {
    @property(Prefab)
    black: Prefab;
    @property(Prefab)
    red: Prefab;
    @property(GraphicsComponent)
    graphic: GraphicsComponent;
    @property(Node)
    popUp: Node = null;
    @property(Button)
    pauseBtn: Button = null;
    @property(Button)
    replayBtn: Button = null;
    @property(Button)
    homeBtn: Button = null;
    @property(Node)
    overlay: Node = null;

    turn: string = "red";
    playerType: string = "red";
    opponentType: string = "black";

    playerId: string = "";
    opponentId: string = "";

    current_piece = new Vec2(-1, -1);

    board: Node[][] = [];
    miniBoard: (string | null)[][] = [];
    l: number = 0;
    t: number = 0;
    validMoves = new Map<string, Vec2[]>();
    cell_size = 67.5;

    black_remain = 12;
    red_remain = 12;

    blackQ_spriteFrame: SpriteFrame;
    redQ_spriteFrame: SpriteFrame;

    uiTransform: UITransform;
    ws: WebSocket = null;

    bot: AI;

    start() {
        this.closePopUp();
        if (GlobalVariables.playingType == "PVP") {
            this.initSocket();
            this.overlay.active = true;
        } else {
            this.playerType = "red";
            this.opponentType = "black";
            this.initboard();
            this.bot = new AI(this.opponentType);
        }
    }

    initboard() {
        for (let i = 0; i < 8; i++) {
            this.board.push(new Array(8).fill(null));
        }
        for (let i = 0; i < 8; i++) {
            this.miniBoard.push(new Array(8).fill(null));
        }
        this.l = -this.cell_size * 3 - this.cell_size / 2;
        this.t = this.cell_size * 3 + this.cell_size / 2;
        resources.load("blackQ/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error("Failed to load sprite frame:", err);
                return;
            }
            this.blackQ_spriteFrame = spriteFrame;
        })
        resources.load("redQ/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error("Failed to load sprite frame:", err);
                return;
            }
            this.redQ_spriteFrame = spriteFrame;
        })

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (i == 3 || i == 4) break;
                if (i % 2 == 0 && j % 2 == 1 || i % 2 == 1 && j % 2 == 0) {
                    let clone_chess = null as Node;
                    if (i < 3) {
                        if (this.opponentType == "black")
                            clone_chess = instantiate(this.black);
                        else clone_chess = instantiate(this.red);
                    } else {
                        if (this.playerType == "red")
                            clone_chess = instantiate(this.red);
                        else clone_chess = instantiate(this.black);
                    }
                    clone_chess.setPosition(this.l + this.cell_size * j, this.t - this.cell_size * i, 0);
                    this.node.addChild(clone_chess);
                    this.board[i][j] = clone_chess;
                    this.miniBoard[i][j] = clone_chess.name == "red" ? "red" : "black";
                    // clone_chess.getComponentInChildren(SpriteComponent).spriteFrame = blackQ;
                }
            }
        }
        this.node.on(Node.EventType.MOUSE_DOWN, (e) => this.onMouseDown(e));
        this.uiTransform = this.node.getComponent(UITransform);
        this.pauseBtn.node.on(Button.EventType.CLICK, (button: Button) => {
            if (GlobalVariables.playingType == "PVA") this.openPopUp()
        });
        this.homeBtn.node.on(Button.EventType.CLICK, (button: Button) => director.loadScene("startScene"));
        this.replayBtn.node.on(Button.EventType.CLICK, (button: Button) => this.closePopUp());

        // this.bot = new AI(this.opponentType);
        // this.aiMove();
    }

    initSocket() {
        if (GlobalVariables.playingType == "PVA") return;
        this.ws = new WebSocket("ws://localhost:3000");
        // this.ws.onmessage = (event) => {
        //     const data = JSON.parse(event.data);
        //     if (data.type == "init") {
        //         switch (data.color) {
        //             case "red":
        //                 this.playerType = "red";
        //                 this.opponentType = "black";
        //                 break;
        //             case "black":
        //                 this.playerType = "black";
        //                 this.opponentType = "red";
        //                 break;
        //             default:
        //                 break;
        //         }

        //         this.overlay.active = false;
        //         this.initboard();
        //     }

        //     if (data.type == "move" && data.color == this.opponentType) {
        //         this.onlinePlayerMove(data);
        //     }
        // }

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type == "init") {
                console.log(data);
                this.playerId = data.id;
            }

            if (data.type == "opponent found") {
                console.log(data);
                this.opponentId = data.opponentId;
                switch (data.color) {
                    case "red":
                        this.playerType = "red";
                        this.opponentType = "black";
                        break;
                    case "black":
                        this.playerType = "black";
                        this.opponentType = "red";
                        break;
                    default:
                        break;
                }
                this.overlay.active = false;
                this.initboard();
            }

            if (data.type == "move" && data.fromPlayer == this.opponentId) {
                this.onlinePlayerMove(data);
            }
        }
    }

    sendData(from: Vec2, to: Vec2) {
        this.ws.send(JSON.stringify({
            type: "move",
            color: this.playerType,
            fromPlayer: this.playerId,
            from,
            to
        }))
    }

    onlinePlayerMove(data) {
        this.current_piece.x = 7 - data.from.x;
        this.current_piece.y = 7 - data.from.y;
        this.getValidMove(7 - data.from.x, 7 - data.from.y);
        this.touch(7 - data.to.x, 7 - data.to.y);
    }

    onMouseDown(e) {
        if (this.turn != this.playerType) return;
        const p = this.uiTransform.convertToNodeSpaceAR(new Vec3(e.getUILocation().x, e.getUILocation().y, 0));
        // alert(p);
        // let x = e.getLocation().x - this.node.getWorldPosition().x;
        // let y = e.getLocation().y - this.node.getWorldPosition().y;
        let x = p.x, y = p.y;
        x = (4 + Math.floor(x / this.cell_size));
        y = (3 - Math.floor(y / this.cell_size));

        // const pos = this.indexToPosition(x, y);
        console.log({ x, y });
        this.touch(x, y);
    }

    touch(x: number, y: number) {
        if (this.board[y][x] != null && this.board[y][x].name.substring(0, 3) == this.turn.substring(0, 3)) {
            if (this.current_piece.x != x || this.current_piece.y != y) {
                this.current_piece.x = x;
                this.current_piece.y = y;
                this.getValidMove(x, y);
                // console.log(this.validMoves);
            }
        } else if (this.board[y][x] == null && this.current_piece.x != -1) {
            const key = JSON.stringify(new Vec2(x, y));
            if (!this.validMoves.has(key)) return;
            const skipped = this.validMoves.get(key);
            this.move(this.current_piece.x, this.current_piece.y, x, y, skipped);
            this.current_piece.x = -1;
            this.current_piece.y = -1;
        } else {
            this.current_piece.x = -1;
            this.current_piece.y = -1;
            this.clearValidMove();
        }
    }

    move(preX: number, preY: number, newX: number, newY: number, skipped: Vec2[]) {
        this.board[preY][preX].setPosition(this.l + newX * this.cell_size, this.t - newY * this.cell_size, 0);
        this.board[newY][newX] = this.board[preY][preX];
        this.board[preY][preX] = null;

        this.miniBoard[newY][newX] = this.miniBoard[preY][preX];
        this.miniBoard[preY][preX] = null;

        if (newY == 0 && this.board[newY][newX].name == this.playerType) {
            if (this.playerType == "red") {
                this.board[newY][newX].getComponentInChildren(SpriteComponent).spriteFrame = this.redQ_spriteFrame;
                this.board[newY][newX].name = "redQ";
                this.miniBoard[newY][newX] = "redQ";
            } else {
                this.board[newY][newX].getComponentInChildren(SpriteComponent).spriteFrame = this.blackQ_spriteFrame;
                this.board[newY][newX].name = "blackQ";
                this.miniBoard[newY][newX] = "blackQ";
            }

        } else if (newY == 7 && this.board[newY][newX].name == this.opponentType) {
            if (this.opponentType == "red") {
                this.board[newY][newX].getComponentInChildren(SpriteComponent).spriteFrame = this.redQ_spriteFrame;
                this.board[newY][newX].name = "redQ";
                this.miniBoard[newY][newX] = "redQ";
            } else {
                this.board[newY][newX].getComponentInChildren(SpriteComponent).spriteFrame = this.blackQ_spriteFrame;
                this.board[newY][newX].name = "blackQ";
                this.miniBoard[newY][newX] = "blackQ";
            }
        }

        skipped?.forEach(piece => {
            if (this.turn == "red") this.red_remain--;
            else if (this.turn == "black") this.black_remain--;
            this.node.removeChild(this.board[piece.y][piece.x]);
            this.board[piece.y][piece.x] = null;
            this.miniBoard[piece.y][piece.x] = null;
        })

        if (GlobalVariables.playingType == "PVP" && this.turn == this.playerType) {
            this.sendData(new Vec2(preX, preY), new Vec2(newX, newY));
        }

        this.changeTurn();
    }

    indexToPosition(j: number, i: number) {
        return { x: this.l + this.cell_size * j - this.cell_size / 2, y: this.t - this.cell_size * i - this.cell_size / 2 }
    }

    positionToIndex(x: number, y: number) {
        return { x: (x - this.l + this.cell_size / 2) / this.cell_size, y: (y - this.t + this.cell_size / 2) / this.cell_size }
    }

    changeTurn() {
        if (this.checkWin()) director.loadScene("startScene");
        this.clearValidMove();
        this.turn = this.turn == "red" ? "black" : "red";
        // if (this.turn == this.playerType) console.log(this.bot.countLeftMoves(this.miniBoard, this.turn));
        if (GlobalVariables.playingType == "PVA" && this.turn == this.opponentType) this.aiMove();
        // console.log(this.turn, this.opponentType);
    }

    aiMove() {
        if (this.turn == this.opponentType) {
            const bestmove = this.bot.minimax(this.miniBoard, GlobalVariables.AI_level, true);
            this.current_piece.x = bestmove[1].from.x;
            this.current_piece.y = bestmove[1].from.y;
            this.getValidMove(bestmove[1].from.x, bestmove[1].from.y);
            this.touch(bestmove[1].to.x, bestmove[1].to.y);
            console.log(bestmove[0]);
        }
    }

    clearValidMove() {
        this.graphic.clear();
        this.validMoves.clear();
    }

    getValidMove(x: number, y: number) {
        if (this.current_piece.x == -1) return;
        this.validMoves.clear();
        if (this.board[y][x].name == this.playerType || this.isQueen(this.board[y][x])) {
            this.traverse(x, y, -1, -1);
            this.traverse(x, y, 1, -1);
        }
        if (this.board[y][x].name == this.opponentType || this.isQueen(this.board[y][x])) {
            this.traverse(x, y, -1, 1);
            this.traverse(x, y, 1, 1);
        }
        this.drawValidMove();
    }

    isQueen(piece: Node) {
        return piece.name[piece.name.length - 1] == 'Q';
    }

    traverse(x: number, y: number, stepX: number, stepY: number, skipped = []) {
        let newX = x + stepX;
        let newY = y + stepY;

        if (newX >= 0 && newY >= 0 && newX < 8 && newY < 8) {
            if (this.board[newY][newX] == null) {
                if (skipped.length == 0) {
                    const key = JSON.stringify(new Vec2(newX, newY));
                    this.validMoves.set(key, []);
                }
                else {
                    const key = JSON.stringify(new Vec2(x, y));
                    this.validMoves.set(key, [...skipped]);
                }
            } else if (this.board[newY][newX].name.substring(0, 3) != this.turn.substring(0, 3)) {
                newX += stepX;
                newY += stepY;
                if (newX >= 0 && newY >= 0 && newX < 8 && newY < 8 && this.board[newY][newX] == null) {
                    skipped.push(new Vec2(newX - stepX, newY - stepY));
                    this.traverse(newX, newY, -stepX, stepY, [...skipped]);
                    this.traverse(newX, newY, stepX, stepY, [...skipped]);
                } else if (skipped.length > 0) {
                    const key = JSON.stringify(new Vec2(x, y));
                    this.validMoves.set(key, [...skipped]);
                }
            } else if (skipped.length > 0) {
                const key = JSON.stringify(new Vec2(x, y));
                this.validMoves.set(key, [...skipped]);
            }
        } else if (skipped.length > 0) {
            const key = JSON.stringify(new Vec2(x, y));
            this.validMoves.set(key, [...skipped]);
        }
    }

    drawValidMove() {
        if (this.validMoves.size == 0) return;
        this.graphic.clear();
        this.validMoves.forEach((value, key) => {
            const move = JSON.parse(key);
            const pos = this.indexToPosition(move.x, move.y);
            this.graphic.circle(pos.x + 34, pos.y + 34, 10);
            this.graphic.fill();
        })
    }

    openPopUp() {
        if (this.popUp.active) return;
        this.popUp.active = true;
        this.overlay.active = true;
    }

    closePopUp() {
        if (!this.popUp.active) return;
        this.popUp.active = false;
        this.overlay.active = false;
    }

    checkWin() {
        return this.red_remain == 0 || this.black_remain == 0;
    }

    update(deltaTime: number) {
        // this.valid_move.clear();
    }
}


