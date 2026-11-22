import { describe, expect, it } from 'vitest';
import { DEFAULT_VALUES, buildAnnouncement, buildHindiSpokenDetails, formatTime, mergeValues, normalizeValue, validateBackup } from '../data/announcementTemplates';
describe('announcement logic',()=>{
 it('builds all requested sections in order',()=>expect(buildAnnouncement(' 42 ','Central Station','Airport','City Hall',' 3 ','15:40',['First message','','Third message'],'Stand clear.')).toBe('Bus number: 42. From: Central Station. To: Airport. Via: City Hall. Platform: 3. Time: 15:40. 1: First message. 3: Third message. Note: Stand clear.'));
 it('handles partial and empty details',()=>{expect(buildAnnouncement('','','','','','',[], '')).toBe('');expect(buildAnnouncement('42','','','','','',[], '')).toBe('Bus number: 42.')});
 it('keeps selected time in 24-hour hours-and-minutes format',()=>{expect(formatTime('15:40')).toBe('15:40');expect(buildAnnouncement('42','','','','','15:40',[], '')).toContain('Time: 15:40.')});
 it('builds a natural Hindi announcement without speaking section numbers',()=>expect(buildHindiSpokenDetails('1120','ब्यावर','अजमेर','मांगलियावास','2','12:20',['पहला संदेश','','तीसरा संदेश'],'')).toBe('यात्रीगण कृपया ध्यान दें। बस नंबर 1120 ब्यावर से अजमेर जाने वाली वाया मांगलियावास दोपहर 12 बजकर 20 मिनट पर प्लेटफॉर्म 2 से रवाना होगी। पहला संदेश। तीसरा संदेश।'));
 it('normalizes whitespace',()=>expect(normalizeValue('  Central\n Station  ')).toBe('Central Station'));
});
describe('backup validation',()=>{
 const valid={schemaVersion:3,exportedAt:'2026-01-01T00:00:00Z',busNumbers:[' 42 ','42'],origins:['Central Station'],destinations:['Airport'],vias:['City Hall'],platforms:['3'],section1:['First'],section2:[],section3:[],section4:[],section5:[],section6:[],section7:[],section8:[],section9:[],section10:[],notes:['Stand clear']};
 it('normalizes and deduplicates a supported backup',()=>{const result=validateBackup(valid);expect(result.ok).toBe(true);if(result.ok){expect(result.data.busNumbers).toEqual(['42']);expect(result.data.origins).toEqual(['Central Station'])}});
 it('migrates version 1 route values to via',()=>{const result=validateBackup({schemaVersion:1,exportedAt:'2026-01-01T00:00:00Z',busNumbers:['42'],routes:['City Hall'],destinations:['Airport'],notes:['Stand clear']});expect(result.ok).toBe(true);if(result.ok)expect(result.data.vias).toEqual(['City Hall'])});
 it.each([{...valid,schemaVersion:4},{...valid,origins:'bad'},{...valid,notes:[42]},{...valid,busNumbers:['x'.repeat(21)]}])('rejects invalid backups without data',candidate=>expect(validateBackup(candidate).ok).toBe(false));
 it('merges without case-insensitive duplicates',()=>{const incoming={...DEFAULT_VALUES,busNumbers:['42','99']};expect(mergeValues(DEFAULT_VALUES,incoming).busNumbers).toEqual(['42','18','7','99'])});
});
