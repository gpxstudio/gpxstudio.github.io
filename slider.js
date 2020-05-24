// MIT License
//
// Copyright (c) 2020 Vianney Coppé https://github.com/vcoppe
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

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
        }
    }

    show() {
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
        this.buttons.unvalidate.style.opacity = 0;
        this.buttons.validate.style.visibility = "hidden";
        this.buttons.unvalidate.style.visibility = "hidden";
    }

    showButtons() {
        this.buttons.validate.style.opacity = 1;
        this.buttons.unvalidate.style.opacity = 1;
        this.buttons.validate.style.visibility = "visible";
        this.buttons.unvalidate.style.visibility = "visible";
    }

    reset() {
        this.start.value = this.start.min;
        this.end.value = this.end.max;
        this.buttons.elev._resetDrag();
        this.hideButtons();
    }

    /*** GPX DATA ***/

    getIndex(val) {
        return this.buttons.elev._findItemForX(parseInt(val)/this.start.max * this.buttons.elev._width());
    }

    getIndexStart() {
        return this.getIndex(this.start.value);
    }

    getIndexEnd() {
        return this.getIndex(this.end.value);
    }
}
