import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
// jsdom has no pseudo-element layout; PrimeReact only uses it for scrollbar measurement.
const computedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = element => computedStyle(element);
