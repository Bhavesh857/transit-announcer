import { describe, expect, it } from 'vitest';
import { DEFAULT_VALUES, buildAnnouncement, buildHindiSpokenDetails, buildSpokenDetails, formatTime, mergeValues, normalizeValue, validateBackup } from '../data/announcementTemplates';
describe('announcement logic',()=>{
 it('builds and normalizes a complete announcement',()=>expect(buildAnnouncement(' 42 ','Airport   Express','14:15',' Terminal 1 ','Platform change.')).toBe('This is bus 42 on the Airport Express to Terminal 1, departing at 2:15 PM. Please note: Platform change.'));
 it('handles partial and empty details',()=>{expect(buildAnnouncement('','','','','')).toBe('');expect(buildAnnouncement('42','','','','')).toBe('This is bus 42.')});
 it('formats selected time for the visible announcement',()=>{expect(formatTime('14:15')).toBe('2:15 PM');expect(buildAnnouncement('42','Airport Express','14:15','Terminal 1','')).toContain('departing at 2:15 PM')});
 it('builds English speech with each populated field name and value',()=>expect(buildSpokenDetails('42','Airport Express','14:15','Terminal 1','Platform change')).toBe('Bus number: 42. Route: Airport Express. Time: 2:15 PM. Destination: Terminal 1. Note: Platform change.'));
 it('builds Hindi speech with translated field names and time',()=>expect(buildHindiSpokenDetails('42','Airport Express','14:15','Terminal 1','Platform change')).toBe('बस नंबर: 42। मार्ग: Airport Express। समय: दोपहर 2 बजकर 15 मिनट। गंतव्य: Terminal 1। सूचना: Platform change।'));
 it('omits empty fields from speech',()=>expect(buildSpokenDetails('42','','','','')).toBe('Bus number: 42.'));
 it('normalizes whitespace',()=>expect(normalizeValue('  Central\n Harbor  ')).toBe('Central Harbor'));
});
describe('backup validation',()=>{
 const valid={schemaVersion:1,exportedAt:'2026-01-01T00:00:00Z',busNumbers:[' 42 ','42'],routes:['Airport   Express'],destinations:['Terminal 1'],notes:['Platform change']};
 it('normalizes and deduplicates a supported backup',()=>{const result=validateBackup(valid);expect(result.ok).toBe(true);if(result.ok){expect(result.data.busNumbers).toEqual(['42']);expect(result.data.routes).toEqual(['Airport Express'])}});
 it.each([{...valid,schemaVersion:2},{...valid,routes:'bad'},{...valid,notes:[42]},{...valid,busNumbers:['x'.repeat(21)]}])('rejects invalid backups without data',candidate=>expect(validateBackup(candidate).ok).toBe(false));
 it('merges without case-insensitive duplicates',()=>{const incoming={...DEFAULT_VALUES,busNumbers:['42','99']};expect(mergeValues(DEFAULT_VALUES,incoming).busNumbers).toEqual(['42','18','7','99'])});
});
