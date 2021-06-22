// gpx.studio is an online GPX file editor which can be found at https://gpx.studio
// Copyright (C) 2020  Vianney Coppé
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

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
        this.buttons.unvalidate.style.opacity = 0;
        this.buttons.validate.style.visibility = "hidden";
        this.buttons.unvalidate.style.visibility = "hidden";
    }

    showButtons() {
        if (this.buttons.embedding) return;
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

    getTraceIndex(val) {
        return this.buttons.elev._findIndexForX(parseInt(val)/this.start.max * this.buttons.elev._width());
    }

    getIndexStart() {
        return this.getTraceIndex(this.start.value);
    }

    getIndexEnd() {
        return this.getTraceIndex(this.end.value);
    }
}
