import Buttons from './buttons.js';
import Total from './total.js';

const buttons = new Buttons();
const total =  new Total(buttons);

total.addTrace('1.gpx', '1.gpx');
