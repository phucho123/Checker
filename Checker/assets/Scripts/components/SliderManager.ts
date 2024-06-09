import { _decorator, Button, Component, director, Label, Node, Slider } from 'cc';
import { GlobalVariables } from '../constant';
const { ccclass, property } = _decorator;

@ccclass('SliderManager')
export class SliderManager extends Component {
    @property(Slider)
    slider: Slider = null;
    @property(Button)
    gobackBtn: Button = null;
    @property(Label)
    levelText: Label = null;
    start() {
        this.levelText.string = JSON.stringify(GlobalVariables.AI_level);
        this.slider.progress = (GlobalVariables.AI_level - 1) / 4;
        this.slider.node.on("slide", (slider: Slider) => {
            GlobalVariables.AI_level = Math.floor(this.slider.progress * 4) + 1;
            this.levelText.string = JSON.stringify(GlobalVariables.AI_level);
            console.log(GlobalVariables.AI_level);
        });

        this.gobackBtn.node.on(Button.EventType.CLICK, (button: Button) => director.loadScene("startScene"), this);
    }

    update(deltaTime: number) {

    }
}


