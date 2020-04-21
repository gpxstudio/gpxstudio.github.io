import Buttons from './buttons.js';
import Total from './total.js';

const buttons = new Buttons();
const total =  new Total(buttons);

total.addTrace('ventoux.gpx', 'ventoux.gpx');

//get_path();
