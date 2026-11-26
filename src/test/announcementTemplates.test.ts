import { describe, expect, it } from 'vitest';
import { DEFAULT_VALUES, buildAnnouncement, buildHindiSpokenDetails, mergeValues, normalizeValue, validateBackup } from '../data/announcementTemplates';
describe('announcement logic',()=>{
 it('shows section numbers in the preview',()=>expect(buildAnnouncement(['First message','','Third message'])).toBe('1: First message. 3: Third message.'));
 it('handles empty sections',()=>expect(buildAnnouncement(Array(10).fill(''))).toBe(''));
 it('speaks values without section numbers',()=>expect(buildHindiSpokenDetails(['पहला संदेश','','तीसरा संदेश'])).toBe('पहला संदेश। तीसरा संदेश।'));
 it('normalizes whitespace',()=>expect(normalizeValue('  पहला\n संदेश  ')).toBe('पहला संदेश'));
});
describe('backup validation',()=>{
 const sections={section1:[' First ','First'],section2:[],section3:[],section4:[],section5:[],section6:[],section7:[],section8:[],section9:[],section10:[],section11:['Extra']};
 const valid={schemaVersion:5,exportedAt:'2026-01-01T00:00:00Z',sections};
 it('normalizes and deduplicates a supported backup',()=>{const result=validateBackup(valid);expect(result.ok).toBe(true);if(result.ok)expect(result.data.sections.section1).toEqual(['First'])});
 it('supports dynamically added sections',()=>{const result=validateBackup(valid);expect(result.ok).toBe(true);if(result.ok)expect(result.data.sections.section11).toEqual(['Extra'])});
 it('migrates version 4 numbered values and removes old fields',()=>{const result=validateBackup({schemaVersion:4,exportedAt:valid.exportedAt,...sections,busNumbers:['42']});expect(result.ok).toBe(true);if(result.ok)expect(Object.keys(result.data.sections)).not.toContain('busNumbers')});
 it.each([{...valid,schemaVersion:6},{...valid,sections:{...sections,section1:'bad'}},{...valid,sections:{...sections,section2:[42]}},{...valid,sections:{...sections,section1:['x'.repeat(201)]}}])('rejects invalid backups without data',candidate=>expect(validateBackup(candidate).ok).toBe(false));
 it('merges without case-insensitive duplicates',()=>{const incoming={...DEFAULT_VALUES,section1:['First','first','Second']};expect(mergeValues({...DEFAULT_VALUES,section1:['First']},incoming).section1).toEqual(['First','Second'])});
});
