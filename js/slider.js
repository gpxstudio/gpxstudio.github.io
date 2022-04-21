export default class Slider {
    constructor(buttons) {
        this.buttons = buttons;
        this.start = buttons.start_slider;
        this.end = buttons.end_slider;

        this.start.addEventListener("input", function () {
            buttons.slider.constrainStart();
        });

        this.end.addEventListener("input", function () {
            buttons.slider.constrainEnd();
        });
    }

    constrainStart() {
        let i = parseInt(this.start.value);
        let j = parseInt(this.end.value);
        if (i > j) {
            this.start.value = j;
            i = j;
        }
        this.update(i, j);
    }

    constrainEnd() {
        let i = parseInt(this.start.value);
        let j = parseInt(this.end.value);
        if (i > j) {
            this.end.value = i;
            j = i;
        }
        this.update(i, j);
    }

    update(i, j) {
        if (i == this.start.min && j == this.end.max) {
            this.reset();
        } else {
            this.showButtons();
            this.buttons.elev._drawRectangle(
                i/this.start.max,
                j/this.end.max,
                this.getIndex(i),
                this.getIndex(j)
            );
            if (this.buttons.total && !this.buttons.total.hasFocus) {
                const trace = this.buttons.total.traces[this.buttons.total.focusOn];
                trace.recomputeStats();
                trace.showData();
            }
        }
    }

    show() {
        if (this.buttons.embedding) return;
        this.start.style.display = 'block';
        this.end.style.display = 'block';
    }

    hide() {
        this.start.style.display = 'none';
        this.end.style.display = 'none';
        this.hideButtons();
    }

    hideButtons() {
        this.buttons.validate.style.opacity = 0;
        this.buttons.validate.style.visibility = "hidden";
    }

    showButtons() {
        if (this.buttons.embedding) return;
        this.buttons.validate.style.opacity = 1;
        this.buttons.validate.style.visibility = "visible";
    }

    reset() {
        this.start.value = this.start.min;
        this.end.value = this.end.max;
        this.buttons.elev._resetDrag();
        this.hideButtons();

        if (this.buttons.total && !this.buttons.total.hasFocus) {
            const trace = this.buttons.total.traces[this.buttons.total.focusOn];
            trace.recomputeStats();
            trace.showData();
        }
    }

    isActive() {
        return this.start.value != this.start.min || this.end.value != this.end.max;
    }

    /*** GPX DATA ***/

    getIndex(val) {
        if (val == this.start.min) return 0;
        if (val == this.end.max) return this.buttons.elev._originalData[this.buttons.elev.options.selectedAttributeIdx].length-1;
        return this.buttons.elev._findItemForX(parseInt(val)/this.start.max * this.buttons.elev._svgWidth);
    }

    getIndexStart() {
        return this.buttons.elev._originalData[this.buttons.elev.options.selectedAttributeIdx][this.getIndex(this.start.value)].trace_index;
    }

    getIndexEnd() {
        return this.buttons.elev._originalData[this.buttons.elev.options.selectedAttributeIdx][this.getIndex(this.end.value)].trace_index;
    }
}
