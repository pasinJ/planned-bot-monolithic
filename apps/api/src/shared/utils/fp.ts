import ioUtils from 'fp-ts-std/IO';
import tUtils from 'fp-ts-std/Task';

export const executeT = tUtils.execute;
export const executeIo = ioUtils.execute;
