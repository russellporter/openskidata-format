import { LiftType, getFormattedLiftType, getLiftColor } from './Lift';
import { Status } from './Status';

describe('Lift', () => {
  describe('getFormattedLiftType', () => {
    it('should format lift types correctly', () => {
      expect(getFormattedLiftType(LiftType.ChairLift)).toBe('Chairlift');
      expect(getFormattedLiftType(LiftType.Gondola)).toBe('Gondola');
      expect(getFormattedLiftType(LiftType.MagicCarpet)).toBe('Magic Carpet');
    });
  });

  describe('getLiftColor', () => {
    it('should return dim red for disused lifts', () => {
      expect(getLiftColor(Status.Disused)).toBe('hsl(0, 53%, 42%)');
      expect(getLiftColor(Status.Abandoned)).toBe('hsl(0, 53%, 42%)');
    });

    it('should return bright red for operating lifts', () => {
      expect(getLiftColor(Status.Operating)).toBe('hsl(0, 82%, 42%)');
      expect(getLiftColor(Status.Construction)).toBe('hsl(0, 82%, 42%)');
    });
  });
});