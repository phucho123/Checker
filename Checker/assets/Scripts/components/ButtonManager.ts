import { _decorator, Button, Component, director, Node } from 'cc';
import { GlobalVariables } from '../constant';
const { ccclass, property } = _decorator;

@ccclass('ButtonManager')
export class ButtonManager extends Component {
    @property(Node)
    pvaBtn: Node = null;
    @property(Node)
    pvpBtn: Node = null;
    @property(Node)
    settingBtn: Node = null;
    start() {
        this.settingBtn.on(Button.EventType.CLICK, (button: Button) => {
            director.loadScene("settingScene");
        }, this);
        this.pvaBtn.on(Button.EventType.CLICK, (button: Button) => {
            GlobalVariables.playingType = "PVA";
            director.loadScene("playScene");
        }, this);
        this.pvpBtn.on(Button.EventType.CLICK, (button: Button) => {
            GlobalVariables.playingType = "PVP";
            director.loadScene("playScene");
        }, this);
    }

    update(deltaTime: number) {

    }
}


