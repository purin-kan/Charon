# Production archive

Production_Work.zip contains all 335 pre-transfer files from the original work/ folder, preserving paths beneath work/. This includes Python builders, mockup data, a reference DOCX used as a typography resource, source extracts, research notes, intermediate drafts and rendered QA images. It is a production-history archive, not another set of current deliverables.

The authoritative finished materials are in ../outputs/. Old resume notes, older workbook copies and early render failures in the archive are superseded. Historical absolute paths and local runtime references may not exist on a teammate's computer.

To inspect or continue PDF production, extract the archive in a separate working copy or carefully restore its work/ folder at the repository root. Do not overwrite current work without comparing files. Builders resolve the repository through their parent directory. Python and reportlab are required; mockup/playguide builders also reference Windows fonts. The workbook builder uses embedded fonts from work/reference.docx. That DOCX is a template resource, not a final Word edition of the workbook. Review dependencies and font availability before rebuilding.

Finished PDFs do not require the builders or these dependencies to read or print. Rebuilding can overwrite exported PDFs and requires fresh visual review. No PDFs were regenerated during this transfer.
