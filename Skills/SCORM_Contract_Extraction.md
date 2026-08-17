Unzip sample-content/RuntimeBasicCalls_SCORM12. Read imsmanifest.xml and every
file in shared/. Report, without inventing anything not in the files:
1) the exact sequence of LMS API calls the content makes (LMSInitialize,
   LMSGetValue, LMSSetValue, LMSCommit, LMSFinish) and their arguments,
2) which cmi.* fields it actually sets (completion status, score, others),
3) the minimum subset of the SCORM 1.2 API our LMS shim needs to implement
   for this package to run and report completion+score,
4) anything the manifest/package assumes that isn't stated in the product brief.
Flag anything ambiguous instead of guessing.