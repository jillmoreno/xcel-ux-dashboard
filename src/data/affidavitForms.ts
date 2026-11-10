/* eslint-disable */
// @ts-nocheck — the forms below are the explorer's own script, ported verbatim (see the header).
/**
 * THE AFFIDAVIT FORMS — 2026-11-03, Afsana. Ported verbatim from her Affidavit
 * Explorer (affidavit-explorer.html, outside the repo): every state, every
 * moment, every field, in the explorer's own words. `AffidavitModalV2` renders
 * them; the explorer's Full scroll pattern, its View (device) control, its
 * Question bank and its Notes were deliberately left behind.
 *
 * ⚠ THE TEXT IS STATE COMPLIANCE COPY. Edit it in the explorer first and port
 * again, or the two will disagree about what a learner swears to. `p`, `ulh`
 * and `olh` strings are HTML (bold, links, line breaks); everything else is
 * plain text.
 *
 * ⚠ WHERE THIS FILE NOW DIFFERS FROM THE EXPLORER — carry these over by hand
 * on the next port, or make them in the explorer first:
 *   · 2026-11-04 — Illinois, After course exam (`IL_POST`): no "Course
 *     Completion Roster upload form" heading and no red box around the roster
 *     section. Afsana's change.
 *   · 2026-11-04 — California, After course exam (`CA_POST_LH`): no "Course
 *     Completion Roster upload form" heading. The heading only — its red box
 *     round the Student Legal Name stays. Afsana's change. (Both went on
 *     2026-11-09: no red box, no "Student Legal Name" heading.)
 *   · 2026-11-04 — THE SIX STATE-SPECIFIC FINAL AFFIDAVITS (`CO_POST`,
 *     `CT_POST`, `MN_POST`, `NY_POST`, `WI_POST`, `WV_POST`) match their
 *     state documents field for field, from Afsana's "State Specific
 *     Affidavit" folder. The explorer split names and addresses by house
 *     rule (its Notes); these forms are the state's, so they cannot:
 *       - every student name is ONE field, labelled as the document labels
 *         it (NY "Full Name", CO/CT/WI/WV "Student Full Name", MN "Name"
 *         under the document's own "Student's Full Legal Name, License
 *         Number, & DOB");
 *       - CO/CT's Proctor Address is one line, with the document's
 *         "(street address, city, state, zip code)";
 *       - CT's exam date carries the document's "(mm/dd/yyyy)";
 *       - MN's Mailing Address is optional "(if different than above)",
 *         with no "same as my business address" checkbox; its proctor Date
 *         carries "Must match course &/or exam".
 *       (Several of these went 2026-11-09 → 11-10: the proctor's standard
 *       name, signature and address; CO/CT's address hint and CT's date
 *       hint; and Minnesota's form brought into line with OCD — see its
 *       comment.)
 *     Kept on purpose though no document has them: the "I confirm that the
 *     above information is accurate" checkbox (the product pre-fills these
 *     forms; Afsana, 2026-11-04) and the pre-filled, locked Today's Date.
 *   · 2026-11-04 — Minnesota, After course exam (`MN_POST`): no red box
 *     round "Company & Address where exam was completed" and its City,
 *     State and Zip Code. Afsana's change.
 *   · 2026-11-04 — Colorado, Connecticut, West Virginia and Wisconsin,
 *     Before course exam: a Pre-Exam Attestation each (`CO_EXAM` …), where
 *     the explorer has "Doc not available yet". Wording provided by Sarah on
 *     11/04/26; at the end of this file.
 *   · 2026-11-04 — Non-state specific (`GEN`), at the end of this file.
 *
 * ⚠ THE EXPLORER IS AN ADMIN TOOL AND SOME OF THIS IS ITS BOOKKEEPING.
 * `status` (ready / received / missing) says whether the document has been
 * added yet; the modal shows a form only when there is one, and an honest
 * "no form yet" panel otherwise. `source` and `note` are the explorer's
 * provenance lines and are not drawn.
 *
 * ⚠ TYPE-CHECKING IS OFF FOR THIS FILE, on purpose. The explorer builds several
 * forms imperatively (Oregon and Nevada borrow Kentucky's fields by index,
 * Connecticut clones Colorado), and making that pass the strict checker means
 * rewriting it — which is the one thing a verbatim port must not do. The
 * exported names keep their annotations, so everything that IMPORTS this file
 * is still fully checked.
 */

export type AffidavitMoment = "pre" | "exam" | "post"

export type AffBlock = {
  h?: string; u?: boolean; h4?: string; p?: string; closing?: string; pageOnly?: boolean; plain?: boolean
  /** Smaller print, for a side note under the fields (2026-11-09). */
  fine?: boolean
  ul?: (string | { t: string; sub: string[] })[]; ulh?: string[]; ol?: string[]; olh?: string[]
  table?: { title: string; head: string[]; rows: string[][] }
}
export type AffField = {
  id?: string; label?: string; type?: string; required?: boolean; placeholder?: string; ac?: string
  inputmode?: string; maxlength?: number; options?: string[]; digits?: number; help?: string
  value?: string; readonly?: boolean; sameAs?: string; img?: string
  row?: AffField[]; block?: AffBlock; flagGroup?: AffField[]; depGroup?: string; items?: AffField[]
}
export type AffPage = { blocks?: AffBlock[]; fields?: AffField[]; who?: "student" | "proctor" }
export type AffForm = {
  docHeader?: string; title: string; source?: string; note?: string
  pages: AffPage[]; fields: AffField[]; after?: AffBlock[]
  agreeLabel?: string; flagFields?: string[]; noPrefill?: string[]; lock?: string[]
  /** A page of the document kept in the modal in Link out. No form uses it since 2026-11-10 (Afsana): the document's text is behind its link. */
  linkKeep?: number; noLink?: boolean; proctorWord?: string; lang?: string
  /** The whole form is the student's: one "Must be completed by the student" banner at the top (non-state-specific forms, 2026-11-09). */
  who?: "student"
}
export type AffEntry = {
  m: AffidavitMoment; doc?: string; st: string; status: "ready" | "received" | "missing"; form?: string
  loas?: string[]; variants?: Record<string, Record<string, string>>
  /** One form per course language and no line of authority (Non-state specific, 2026-11-04). */
  byLanguage?: Record<string, string>
}

export const MOMENTS: { id: AffidavitMoment; label: string }[] =[{id:'pre',label:'Before course begins'},{id:'exam',label:'Before course exam'},{id:'post',label:'After course exam'}];
/* Why the SSN is asked for — the "SSN Veribage" column of the compliance
   team's XCEL-PE_Affidavits_and_EAs.xlsx (2026-11-06), the same sentence for
   CA (last 4), IL (full SSN) and both Ohio forms (last 4). The sheet has two
   spaces in "a  course"; one is kept. */
export const SSN_REASON =
  'This information will enable the Commissioner to properly identify and assign credit to students who have completed a course.'
export const DOCS: { id: string; label: string }[] =[{id:'privacy',label:'Privacy statement'},{id:'enroll',label:'Enrollment agreement'},{id:'reg',label:'Registration form'},{id:'manual',label:'Study-manual notice'},{id:'terms',label:'Terms and conditions'}];
export const STATES: Record<string, string> ={CA:'California',CO:'Colorado',CT:'Connecticut',FL:'Florida',IL:'Illinois',KY:'Kentucky',MN:'Minnesota',MS:'Mississippi',NV:'Nevada',NY:'New York',OH:'Ohio',OR:'Oregon',WI:'Wisconsin',WV:'West Virginia'};
export const STATUS: Record<string, string> ={ready:'In the explorer',received:'Doc received, not added yet',missing:'Doc not available yet'};
export const ENTRIES: AffEntry[] =[
  {m:'pre',doc:'privacy',st:'IL',status:'ready',form:'IL_PRE'},
  {m:'pre',doc:'privacy',st:'MN',status:'ready',form:'MN_PRE'},
  {m:'pre',doc:'enroll',st:'KY',status:'ready',form:'KY_PRE'},
  {m:'pre',doc:'enroll',st:'NV',status:'ready',form:'NV_PRE'},
  {m:'pre',doc:'enroll',st:'OR',status:'ready',form:'OR_PRE'},
  {m:'pre',doc:'reg',st:'OH',status:'ready',form:'OH_PRE'},
  {m:'pre',doc:'manual',st:'FL',status:'received',loas:['Life & Health','Property & Casualty'],variants:{'Life & Health':{English:'FL_LH_EN',Spanish:'FL_LH_ES'},'Property & Casualty':{English:'FL_PC_EN',Spanish:'FL_PC_ES'}}},
  {m:'pre',doc:'terms',st:'CA',status:'ready',form:'CA_PRE'},
  {m:'exam',st:'FL',status:'ready',form:'FL_EXAM'},{m:'exam',st:'MN',status:'ready',form:'MN_EXAM'},
  {m:'exam',st:'CO',status:'missing'},{m:'exam',st:'CT',status:'missing'},{m:'exam',st:'WV',status:'missing'},{m:'exam',st:'WI',status:'missing'},
  {m:'post',st:'CA',status:'received',loas:['Life & Health'],variants:{'Life & Health':{English:'CA_POST_LH'}}},{m:'post',st:'IL',status:'ready',form:'IL_POST'},{m:'post',st:'OH',status:'received',loas:['Property'],variants:{'Property':{English:'OH_POST_P'}}},{m:'post',st:'NY',status:'ready',form:'NY_POST'},
  {m:'post',st:'CO',status:'ready',form:'CO_POST'},{m:'post',st:'CT',status:'ready',form:'CT_POST'},{m:'post',st:'MN',status:'ready',form:'MN_POST'},{m:'post',st:'MS',status:'missing'},{m:'post',st:'WV',status:'ready',form:'WV_POST'},{m:'post',st:'WI',status:'ready',form:'WI_POST'}
];
export const FORMS: Record<string, AffForm> ={
  IL_PRE:{
    docHeader:'Illinois Prelicensing',
    title:'Terms and Conditions Pre-Course Affidavit',
    source:'Word doc · Illinois Prelicensing, Terms and Conditions Pre-Course Affidavit',
    pages:[
      {blocks:[
        {h:'Acknowledgment of Terms and Conditions of Pre-licensing Course Completion'},
        {p:'The state of Illinois requires applicants to complete 20 hours of pre-licensing education for each major line of authority. 7.5 of those hours must be completed in a classroom (webinar) setting. Additionally, students must complete a comprehensive final exam with a score of at least 70% and affirm that they, and only they, completed the course.'},
        {p:'To be eligible for a Certificate of completion, you must follow several steps:'},
        {ul:['Complete the self-study portion of the course including passing the final exam with a score of at least 70%','Attend the entire 7.5-hour webinar',{t:'Affirm that you, and only you, completed the course by submitting your electronic affidavit.',sub:['The course completion affidavit is available within two days of fulfilling the course completion requirements (online course, online comprehensive final exam, and webinar).']}]}
      ]},
      {blocks:[
        {h:'Student Notice:'},
        {p:'<strong>Student information will not be sold or distributed to any third party without prior written consent of the student.</strong> By selecting "I Agree" below, you agree that your course information can be shared with state testing centers, state insurance departments, and with any third-party insurance agency or company.'}
      ]}
    ],
    fields:[{id:'sig',label:'Student Signature',required:true,placeholder:'Type your full name',ac:'name'}],
    note:'IL uses this same form for every line of authority.'
  },
  KY_PRE:{
    docHeader:'Kentucky Commission on Proprietary Education',
    title:'Kentucky Commission on Proprietary Education: Enrollment Agreement',
    source:'Word doc · KY PE-Pre-Course Enrollment Agreement',
    pages:[
      {blocks:[
        {p:'<strong>Course Program Name:</strong> Kentucky Health Prelicensing (20hrs)'},
        {p:'<strong>Online Self-study:</strong> 20-hour PE program'},
        {p:'<strong>Course Fee:</strong> $199.00'},
        {p:'<strong>Program Length:</strong> 30 days from purchase date.'},
        {h:'Course Program Objective:'},
        {p:'Students will possess an understanding of the different types of insurance companies, how insurance is sold, industry oversight and regulation, concepts and treatment of risks, the elements of a contract and how to practically apply the legal concepts while conducting business, types and uses of health insurance policies, types of health insurance providers, and differentiate between commercial, government and alternative options, Disability income benefits, types of medical expenses policies, deductibles and coinsurance, Medicare and Medicaid policies, long-term care, health insurance policy provisions and exclusions, health insurance premium factors, an laws and regulations pertinent to insurance. The primary objective is to also prepare the student for the related Kentucky state insurance licensing exam in these areas of competence.'},
        {p:'There are no other fees or expenses associated with the cost of the course unless extensions are purchased as outlined below. Items subject to cost change.'},
        {p:'XCEL Solutions does not charge a tuition; the student will pay for each course they would like to take. All students are required to pay for the course in full before they start the course. XCEL Solutions does not offer financial aid or any other type of financing. Course fee may be paid via credit cards: Visa, MasterCard, or American Express.'}
      ]},
      {blocks:[
        {h:'Terms of Agreement',u:true},
        {ol:['XCEL Solutions is open to all persons who meet the entrance requirements regardless of age, race, color, religion, national origin, disability, sex, sexual orientation or gender identity or expression.','XCEL Solutions does not recognize credit from previous education and training programs. The transfer of course credit is determined by the receiving institution.','XCEL Solutions does not offer outside funding','Placement in a job is not guaranteed nor promised to graduates.','It is advisable to contact your state regulator for information specific to becoming an Insurance Producer in your state.']},
        {h:'Cancellation and Refund Policies:',u:true},
        {h4:'Online Instructor-led and Online Self-Paced/Video Courses'},
        {ul:['Starting from the date of purchase, students have 30 days to request a refund.']},
        {h4:'Webinar and In-Person Live Courses - (Not applicable to Kentucky residents)'},
        {ul:['Students have until 3 days prior to class start to request a refund.','Livestream and Classroom students who do not attend their scheduled class will not qualify for a refund.','Students can swap to a self-paced online course (when applicable) if they no longer qualify for a refund.']},
        {h4:'All Modalities'},
        {ul:['If any course (sold individually or in a package) is accessed, the course/package is non-refundable.','Textbooks and shipping are non-refundable','Any refunds for packages that included a physical textbook will be refunded less a $24.95 refund fee.']},
        {p:'To request a refund, please contact us at 866-559-9235.'}
      ]},
      {blocks:[
        {h:'Student Grievance:',u:true},
        {p:'Students aggrieved by action of XCEL or personnel of the school should attempt to resolve these issues with proper XCEL personnel. The student shall submit a written internal grievance to the following email: compliance@xcelsolutions.com. The email subject line shall be labeled, "Student Grievance". Students may also submit a letter via certified US mail to: XCEL Solutions, LLC. Attn: School Director, 218 Liberty Street, Warren, PA 16365. Students will receive a response and an offer or resolution within 10 business days. The student\'s sponsor/employer may be consulted in determining the resolution.'},
        {h:'Filing a complaint with the Kentucky Commission on Proprietary Education:',u:true},
        {p:'To file a complaint with Kentucky Commission on Proprietary Education, a complaint shall be in writing and shall be filed on a Form PE-24, Form to File a Complaint, accompanied, if applicable, by Form PE-25, Authorization for Release of Student Records.'},
        {p:'The form must be mailed to the following address:'},
        {p:'Kentucky Commission on Proprietary Education<br>500 Mero Street, 4th Floor, Frankfort, Kentucky, 40601'},
        {p:'The form can be found on CPE website - <a href="https://kcpe.ky.gov/Pages/index.aspx" target="_blank" rel="noopener"><strong>www.kcpe.ky.gov</strong></a>'}
      ]},
      {blocks:[
        {h:'Existence of the Student Protection Fund',u:true},
        {p:'Pursuant to KRS 165A.450 All licensed schools, resident, and nonresident, shall be required to contribute to a student protection fund. The fund shall be used to reimburse eligible Kentucky students, to pay off debts, including refunds to students enrolled or on leave of absence by not being enrolled for one (1) academic year or less from the school at the time of the closing, incurred due to the closing of a school, discontinuance of a program, loss of license, or loss of accreditation by a school or program.'},
        {h:'Process for Filing a Claim Against the Kentucky Student Protection Fund',u:true},
        {p:'To file a claim against the Kentucky Student Protection Fund, each person filing must submit a signed and completed Form for Claims Against the Student Protection Fund, Form PE-38 and provide the requested information to the following address:'},
        {p:'Kentucky Commission on Proprietary Education<br>500 Mero Street, 4<sup>th</sup> Floor<br>Frankfort, Kentucky 40601'},
        {p:'Forms may be located at <a href="https://kcpe.ky.gov/Pages/index.aspx" target="_blank" rel="noopener"><strong>http://www.kcpe.ky.gov/</strong></a>'}
      ]},
      {blocks:[
        {p:'By clicking on the confirmation button below, you agree to the terms of this Enrollment Agreement.'},
        {ulh:['I received a copy of the catalog <strong>(<a href="https://prepare2pass.com/XCEL_Kentucky_Catalog_2026.pdf" target="_blank" rel="noopener">Kentucky School Catalog</a>)</strong> and understand that is part of the enrollment agreement.','I understand this enrollment agreement constitutes a binding contract.','<strong>My signature below signifies that I have read and understand all aspects of this agreement, I am at least 18 years of age, and I do recognize my legal responsibilities in regard to this contract.</strong>']}
      ]}
    ],
    fields:[
      {id:'agree',type:'checkbox',label:'I confirm that the above information is accurate',required:true},
      {row:[{id:'first',label:'First Name',required:true,placeholder:'First name',ac:'given-name'},{id:'middle',label:'Middle Name',placeholder:'Middle name',ac:'additional-name'}]},
      {row:[{id:'last',label:'Last Name',required:true,placeholder:'Last name',ac:'family-name'},{id:'suffix',type:'select',label:'Suffix',placeholder:'Select suffix',ac:'honorific-suffix',options:['Jr.','Sr.','II','III','IV','V']}]},
      {id:'addr1',label:'Address Line 1',required:true,placeholder:'Street address',ac:'address-line1'},
      {id:'addr2',label:'Address Line 2 (Optional)',placeholder:'Apt, suite, unit, etc.',ac:'address-line2'},
      {id:'city',label:'City',required:true,placeholder:'City',ac:'address-level2'},
      {id:'state',type:'select',label:'State',required:true,placeholder:'Select state',ac:'address-level1',options:'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ')},
      {id:'zip',label:'Zip',required:true,placeholder:'ZIP code',ac:'postal-code',inputmode:'numeric'},
      {id:'phone',type:'tel',label:'Phone Number',required:true,placeholder:'(555) 000-0000',ac:'tel'},
      {id:'email',type:'email',label:'Email Address',required:true,placeholder:'Enter email address',ac:'email'},
      {id:'date',type:'date',label:"Today's Date",required:true},
      {id:'cmsig',type:'staticsig',label:'XCEL Solutions Compliance Manager:',img:'data:image/png;base64,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'}
    ],
    agreeLabel:'Confirmation',
    flagFields:['agree'],
    after:[{closing:'This Enrollment Agreement constitutes a binding contract. Students receive a copy of the agreement, and the original copy is kept by the school.'}],
    note:'Fields follow your mockup, with the Compliance Manager signature from the Word doc after Today’s Date. The button reads "Confirmation", matching the doc’s “confirmation button” wording.'
  },
  MN_PRE:{
    docHeader:'Minnesota Prelicensing',
    title:'Minnesota Prelicensing Terms and Conditions Pre-Course Affidavit', // 2026-11-10, Afsana
    source:'PDF · MN PE-Terms and Conditions-Pre-Course Affidavit',
    pages:[
      {blocks:[
        {h:'Acknowledgement of Terms and Conditions of Pre-licensing Course Completion'},
        {p:'The state of Minnesota requires applicants to complete 20 hours of pre-licensing education for each major line of authority.'},
        {p:'Applicants seeking to become licensed as a Life producer, Health producer, Casualty Producer, Property Producer or Personal Lines Producer must complete 20 hours of pre-licensing education. XCEL Solutions will be tracking your time in the course.'},
        {p:'Please note per insurance code regulating pre-licensing education, you will be signed out of your course after 10 minutes of inactivity, and any time accumulated between the last time you saved your progress and the time you were logged out will be removed from your study history.'},
        {p:'Any student caught attempting to manipulate or falsify his time will have his account suspended pending further investigation. The student’s study history may be shared with the state’s Department of Insurance for further investigation if it is determined that his course was submitted as “completed,” as he might have willfully violated an insurance regulation by attempting to manipulate or falsify his time.'}
      ]},
      {blocks:[
        {h:'Acknowledgement of Terms and Conditions (continued)',pageOnly:true},
        {p:'The final exam for this course must be a proctored, closed-book exam with no assistance provided. A disinterested third party must proctor the exam. The disinterested third-party proctor or monitor is an individual who has none of the following: family relationship with the student; is a direct supervisor of the student; or a person directly supervised by the student.'},
        {p:'A certificate of course completion will be presented within 2 business days of the date the student meets the minimum hour requirements, in addition to passing the course\'s final, proctored, exam with a score of 70% or better. The pre-licensing course completion date is the date a member of the compliance department verifies and determines all course and hour requirements have been met.'},
        {p:'License education credit will not be awarded for taking the course after it loses its status as an approved course.'}
      ]},
      {blocks:[
        {h:'Personally Identifiable Information'},
        {p:'XCEL may have engaged third parties to work with it, or on its behalf, to provide services such as fulfilling orders, processing payments, monitoring site activities and the like. Your personally identifiable information will be disclosed to those third parties to the extent necessary for the purposes of performing the specific services for which those third parties were engaged by XCEL. XCEL will disclose personally identifiable information when it has reason to believe that your actions violate any applicable laws or any usage restrictions for the products or services purchased from XCEL. In addition, XCEL will disclose such information in connection with legal action or if XCEL reasonably believes that such disclosure is necessary to protect the rights, property, or safety of XCEL, its customers or the users of any XCEL controlled Website. XCEL will disclose personally identifiable information in response to a court order, subpoena, law enforcement agency inquiry, other legal process or when required to do so by law. Except as provided in this paragraph, XCEL will not sell or distribute your personally identifiable information to third parties without your consent.'}
      ]},
      {blocks:[
        {h:'Minimum System Requirements'},
        {p:'XCEL Solutions runs on the latest versions of all popular browsers. If support for a browser is being dropped, reasonable notice will be provided to all clients. In addition, the user interface allows learners to access their learning portal and courses on various mobile devices including:'},
        {p:'iPads, iPhones &amp; iPods Touch<br>Android tablets &amp; smartphones'},
        {table:{title:'Fully supported browsers',head:['Mobile','Desktop'],rows:[['Chrome','Chrome'],['Safari','Safari (Mac only)'],['Internet Explorer','Internet Explorer (8,9,10,11)'],['Android','Firefox']]}}
      ]}
    ],
    fields:[],
    note:'This form has no fields, so I Agree depends only on reading the content.'
  }
};
FORMS.NV_PRE={
  docHeader:'Nevada Commission on Postsecondary Education',
  title:'Nevada Commission on Postsecondary Education: Enrollment Agreement',
  source:'Word doc · NV PE-Pre-Course Enrollment Agreement',
  pages:[
    {blocks:[
      {p:'<strong>Course Program Name:</strong> Nevada Health Prelicensing (20hrs)'},
      {p:'<strong>Online Self-study:</strong> 20-hour PE program'},
      {p:'<strong>Course Fee:</strong> $199.00'},
      {p:'<strong>Reporting Fee</strong>: $9.00'},
      {p:'<strong>Program Length:</strong> 30 days from purchase date.'},
      {p:'<strong>Course Program Objective: </strong>Students will possess an understanding of the different types of insurance companies, how insurance is sold, industry oversight and regulation, concepts and treatment of risks, the elements of a contract and how to practically apply the legal concepts while conducting business, types and uses of health insurance policies, types of health insurance providers, and differentiate between commercial, government and alternative options, Disability income benefits, types of medical expenses policies, deductibles and coinsurance, Medicare and Medicaid policies, long-term care, health insurance policy provisions and exclusions, health insurance premium factors, an laws and regulations pertinent to insurance. The primary objective is to also prepare the student for the related Nevada state insurance licensing exam in the these areas of competence.'},
      {p:'There are no other fees or expenses associated with the cost of the course unless extensions are purchased as outlined below. Items subject to cost change.'},
      {p:'XCEL Solutions does not charge a tuition; the student will pay for each course they would like to take. All students are required to pay for the course in full before they start the course. XCEL Solutions does not offer financial aid or any other type of financing. Course fee may be paid via credit cards: Visa, MasterCard, or American Express.'}
    ]},
    {blocks:[
      {h:'Terms of Agreement'},
      {olh:['XCEL Solutions is open to all persons who meet the entrance requirements regardless of age, race, color, religion, national origin, disability, sex, sexual orientation or gender identity or expression.','XCEL Solutions does not recognize credit from previous education and training programs. The transfer of course credit is determined by the receiving institution.','XCEL Solutions does not offer outside funding','<strong>Placement in a job is not guaranteed nor promised to graduates</strong>.','It is advisable to contact your state regulator for information specific to becoming an Insurance Producer in your state.']},
      {h:'Cancellation Policies:',u:true},
      {p:'A student may cancel enrollment by emailing XCEL Solutions at <a href="mailto:support@xcelsolutions.com"><strong>support@xcelsolutions.com</strong></a>'},
      {p:'If cancellation occurs within 72 hours of the date of enrollment all monies shall be refunded to the student.'}
    ]},
    {blocks:[
      {h:'Student Grievance:',u:true},
      {p:'Students aggrieved by action of XCEL or personnel of the school should attempt to resolve these issues with proper XCEL personnel. The student shall submit a written internal grievance to the following email: compliance@xcelsolutions.com. The email subject line shall be labeled, "Student Grievance". Students may also submit a letter via certified US mail to: XCEL Solutions, LLC. Attn: School Director, 218 Liberty Street, Warren, PA 16365. Students will receive a response and an offer or resolution within 10 business days. The student\'s sponsor/employer may be consulted in determining the resolution.'},
      {h:'Filing a complaint with the Nevada Commission on Postsecondary:',u:true},
      {p:'To file a complaint against a postsecondary institution subject to the laws of Nevada Commission on Postsecondary NRS and NAC Chapters 394, please fill out and submit this form to the address listed below.'},
      {p:'The form must be mailed to the following address:'},
      {p:'Commission on Postsecondary Education<br>2800 E. St. Louis Avenue, Las Vegas, NV 89104'},
      {p:'The form can be found on CPE website - <a href="http://cpe.nv.gov/uploadedFiles/cpenvgov/content/Students/Complaint%20Form%20Initial%202021.pdf" target="_blank" rel="noopener"><strong>www.cpe.nv.gov</strong></a>'}
    ]},
    {blocks:[
      {p:'By clicking on the confirmation button below, you agree to the terms of this Enrollment Agreement.'},
      {ulh:['I received a copy of the catalog <strong>(<a href="https://prepare2pass.com/XCEL_Nevada_Catalog_2026.pdf" target="_blank" rel="noopener">Nevada School Catalog</a>)</strong> and understand that is part of the enrollment agreement.','I understand this enrollment agreement constitutes a binding contract.','<strong>My signature below signifies that I have read and understand all aspects of this agreement, I am at least 18 years of age, and I also had the opportunity to ask questions.</strong>']}
    ]}
  ],
  fields:FORMS.KY_PRE.fields,
  agreeLabel:'Confirmation',
  flagFields:['agree'],
  after:FORMS.KY_PRE.after,
  note:'Same form fields as Kentucky, including the Compliance Manager signature. The button reads "Confirmation", matching the doc’s “confirmation button” wording.'
};
(function(){
  const base=FORMS.KY_PRE.fields;
  const pick=id=>base.find(x=>x.id===id);
  const counties='Baker,Benton,Clackamas,Clatsop,Columbia,Coos,Crook,Curry,Deschutes,Douglas,Gilliam,Grant,Harney,Hood River,Jackson,Jefferson,Josephine,Klamath,Lake,Lane,Lincoln,Linn,Malheur,Marion,Morrow,Multnomah,Polk,Sherman,Tillamook,Umatilla,Union,Wallowa,Wasco,Washington,Wheeler,Yamhill'.split(',');
  FORMS.OR_PRE={
  docHeader:'Oregon Higher Education Coordinating Commission',
  title:'Oregon Higher Education Coordinating Commission: Enrollment Agreement',
  source:'Word doc · OR PE-Pre-Course Enrollment Agreement',
  pages:[
    {blocks:[
      {p:'<strong>Course Program Name:</strong> Oregon Health Prelicensing (20hrs)'},
      {p:'<strong>Online Self-study:</strong> 20-hour PE program'},
      {p:'<strong>Fee:</strong> $199.00'},
      {p:'<strong>Program Length:</strong> 30 days from purchase date.'},
      {p:'<strong>Course Program Objective: </strong>Students will possess an understanding of the different types of insurance companies, how insurance is sold, industry oversight and regulation, concepts and treatment of risks, the elements of a contract and how to practically apply the legal concepts while conducting business, types and uses of health insurance policies, types of health insurance providers, and differentiate between commercial, government and alternative options, Disability income benefits, types of medical expenses policies, deductibles and coinsurance, Medicare and Medicaid policies, long-term care, health insurance policy provisions and exclusions, health insurance premium factors, an laws and regulations pertinent to insurance. The primary objective is to also prepare the student for the related Oregon state insurance licensing exam in the these areas of competence.'},
      {p:'There are no other fees or expenses associated with the cost of the course unless extensions are purchased as outlined below. Items subject to cost change.'},
      {p:'XCEL Solutions does not charge a tuition; the student will pay for each course they would like to take. All students are required to pay for the course in full before they start the course. XCEL Solutions does not offer financial aid or any other type of financing. Course fee may be paid via credit cards: Visa, MasterCard, or American Express.'}
    ]},
    {blocks:[
      {h:'Terms of Agreement'},
      {ol:['XCEL Solutions is open to all persons who meet the entrance requirements regardless of age, race, color, religion, national origin, disability, sex, sexual orientation or gender identity or expression.','XCEL Solutions does not recognize credit from previous education and training programs. The transfer of course credit is determined by the receiving institution.','XCEL Solutions does not offer outside funding','Placement in a job is not guaranteed nor promised to graduates.','We do offer course extensions for missed time when a student hardship has occurred.','Students must successfully complete all required reading, course assignments, quizzes, and the final exam in order for course credit and a completion certificate to be issued. If the final examination is not passed on the first attempt, additional attempts will be permitted.','Students must take and pass the final examination with a minimum score of at least 70% based on the information presented throughout the course. The final exam will not become available until all required assignments have been completed.','Completion certificates/transcripts will be distributed through the student\'s profile upon course completion.','It is advisable to contact your state regulator for information specific to becoming an Insurance Producer in your state.']}
    ]},
    {blocks:[
      {h:'Cancellation and Refund Policies:'},
      {h4:'Online Instructor-led and Online Self-Paced/Video Courses'},
      {ul:['Starting from the date of purchase, students have 30 days to request a refund.']},
      {h4:'Webinar and In-Person Live Courses - (Not applicable to Oregon residents)'},
      {ul:['Students have until 3 days prior to class start to request a refund.','Livestream and Classroom students who do not attend their scheduled class will not qualify for a refund.','Students can swap to a self-paced online course (when applicable) if they no longer qualify for a refund.']},
      {h4:'All Modalities'},
      {ul:['If any course (sold individually or in a package) is accessed, the course/package is non-refundable.','Textbooks and shipping are non-refundable','Any refunds for packages that included a physical textbook will be refunded less a $24.95 refund fee.']},
      {p:'To request a refund, please contact us at 866-559-9235.'},
      {p:'Any inquiry a student may have regarding this contract may be made in writing to XCEL Solutions LLC, Compliance Department, 218 Liberty Street, Warren, PA 16365 or via email <a href="mailto:compliance@xcelsolutions.com"><strong>compliance@xcelsolutions.com</strong></a> and or to the Higher Education Coordinating Commission, Private Career Schools Licensing Unit, 3225 25th Street SE, Salem, OR, or by calling (503) 947-5751.'}
    ]},
    {blocks:[
      {p:'By clicking on the confirmation button below, you agree to the terms of this Enrollment Agreement.'},
      {ulh:['I received a copy of the catalog <strong>(<a href="https://prepare2pass.com/XCEL_OR_Catalog_2026.pdf" target="_blank" rel="noopener">Oregon school catalog</a>)</strong> and understand that is part of the enrollment agreement.','I understand this enrollment agreement constitutes a binding contract.','<strong>My signature below signifies that I have read and understand all aspects of this agreement, I am at least 18 years of age, and do recognize my legal responsibilities in regard to this contract.</strong>']}
    ]}
  ],
  fields:[
    base[1], base[2], pick('addr1'), pick('addr2'), pick('city'), pick('state'), pick('zip'), pick('phone'),
    {id:'dob',type:'date',label:'Full Date of Birth',required:true,ac:'bday'},
    {id:'gender',type:'select',label:'Gender',required:true,placeholder:'Select gender',options:['M','F']},
    {id:'veteran',type:'select',label:'Veteran',required:true,placeholder:'Select',options:['Y','N']},
    {id:'county',type:'select',label:'County of Oregon you reside in',required:true,placeholder:'Select county',options:counties},
    {id:'ethnicity',type:'select',label:'Ethnicity',required:true,placeholder:'Select ethnicity',options:['African American','Asian','Caucasian','Hispanic/Latino','International','Native American','Native Hawaiian','Pacific Islander']},
    pick('date'),
    pick('agree'),
    pick('cmsig')
  ],
  agreeLabel:'Confirmation',
  flagFields:['agree'],
  after:FORMS.KY_PRE.after,
  note:'Standard enrollment fields plus Oregon’s extra ones from the Word doc (date of birth, gender, veteran, county, ethnicity), all shown as dropdowns or a date picker. The button reads "Confirmation", matching the doc’s “confirmation button” wording.'
  };
})();
(function(){
  const base=FORMS.KY_PRE.fields;
  const pick=id=>base.find(x=>x.id===id);
  FORMS.OH_PRE={
  docHeader:'Ohio Department of Insurance',
  title:'Ohio Department of Insurance: Prelicensing Education Student Registration Form',
  source:'Word doc · OH PE-Registration Form-Pre Course Enrollment Agreement',
  pages:[
    {blocks:[
      {p:'<strong>Provider Name: XCEL Solutions, LLC.</strong>'},
      {p:'<strong>Provider ID#: 3640</strong>'},
      {p:'<strong>Course Type/Program Name:</strong> Ohio Health Prelicensing'},
      {p:'<strong>Study Materials:</strong>'},
      {ulh:['(A) Textbook Title and Author/Edition: N/A','(B) <a href="https://candidate.psiexams.com/bulletin/display_bulletin.jsp?ro=yes&amp;actionname=83&amp;bulletinid=804&amp;bulletinurl=.pdf" target="_blank" rel="noopener"><strong>Ohio Bulletin</strong></a> and Course Outline: Below','(C) Other (explain): N/A','(D) The Text and other materials will be the property of the Provider'],plain:true},
      {p:'<strong>Self-Study Offering</strong>:'},
      {ulh:['Date Study Material Purchased: Refer to receipt.','Exam Method: Electronic','Exam Location: <a href="http://www.xcelsolutions.com/" target="_blank" rel="noopener"><strong>www.xcelsolutions.com</strong></a>'],plain:true},
      {p:'<strong>Course Fee:</strong> $199.00'},
      {p:'<strong>School Fees: N/A</strong>'}
    ]},
    {blocks:[
      {p:'There are no other fees or expenses associated with the cost of the course unless extensions are purchased as outlined below. Items subject to cost change.'},
      {p:'XCEL Solutions does not charge a tuition; the student will pay for each course they would like to take. All students are required to pay for the course in full before they start the course. XCEL Solutions does not offer financial aid or any other type of financing. Course fee may be paid via credit cards: Visa, MasterCard, or American Express.'},
      {p:'<strong>Online Self-study: </strong>20-hour PE program'},
      {p:'<strong>Program Length: </strong>30 days from purchase date.'},
      {h:'Course Program Objective:'},
      {p:'Students will possess an understanding of the different types of insurance companies, how insurance is sold, industry oversight and regulation, concepts and treatment of risks, the elements of a contract and how to practically apply the legal concepts while conducting business, types and uses of health insurance policies, types of health insurance providers, and differentiate between commercial, government and alternative options, Disability income benefits, types of medical expenses policies, deductibles and coinsurance, Medicare and Medicaid policies, long-term care, health insurance policy provisions and exclusions, health insurance premium factors, an laws and regulations pertinent to insurance. The primary objective is to also prepare the student for the related Ohio state insurance licensing exam in these areas of competence.'}
    ]},
    {blocks:[
      {h:'Cancellation and Refund Policies:',u:true},
      {h4:'Online Instructor-led and Online Self-Paced/Video Courses'},
      {ul:['Starting from the date of purchase, students have 30 days to request a refund.']},
      {h4:'Webinar and In-Person Live Courses'},
      {ul:['Students have until 3 days prior to class start to request a refund.','Livestream and Classroom students who do not attend their scheduled class will not qualify for a refund.','Students can swap to a self-paced online course (when applicable) if they no longer qualify for a refund.']},
      {h4:'All Modalities'},
      {ul:['If any course (sold individually or in a package) is accessed, the course/package is non-refundable.','Textbooks and shipping are non-refundable.','Any refunds for packages that included a physical textbook will be refunded less a $24.95 refund fee.']},
      {p:'To request a refund, please contact us at 866-559-9235.'}
    ]},
    /* CHANGED FROM THE DOCUMENT (2026-11-09, Afsana): its "TO BE COMPLETED BY
       STUDENT:" heading is gone — the student banner at the top says it. The
       page stays, holding the fields. */
    {blocks:[]}
  ],
  fields:[
    base[1], base[2],
    /* 2026-11-06, Afsana: the compliance sheet's SSN wording, above the field. */
    {block:{p:SSN_REASON}},
    {id:'ssn4',label:'Last 4 of SSN',required:true,placeholder:'0000',inputmode:'numeric',maxlength:4,digits:4,ac:'off'},
    {id:'dob',type:'date',label:'Date of Birth',required:true,ac:'bday'},
    pick('addr1'), pick('addr2'), pick('city'), pick('state'), pick('zip'), pick('phone'),
    {id:'date',type:'date',label:"Today's Date",required:true},
    {id:'sig',label:'Student Signature',required:true,placeholder:'Type your full name',ac:'name'},
    pick('agree')
  ],
  agreeLabel:'I Attest and Confirm',
  flagFields:['agree'],
  note:'Fields follow the Word doc’s student section, using the same name and address fields as the other states. Last 4 of SSN must be exactly 4 digits. The "I confirm that the above information is accurate" checkbox (highlighted in red) comes after Student Signature, and the button reads "I Attest and Confirm".'
  };
})();
FORMS.FL_LH_EN={
  docHeader:'Florida Pre-Course Notice for Life and Health',
  title:'Florida Pre-Course Notice for Life and Health',
  source:'Word doc · FL PE-Pre Course Notice-LifeHealth (English section)',
  pages:[{blocks:[
    {p:'The Florida Department of Financial Services requires a study manual for life and/or health courses, NAIFA Health&amp; Life (including Annuities &amp; Variable Contracts). The related state licensing examination will be based upon the latest edition of the Florida Life, Health and Variable Annuity Study Manual. The Study Manual is not included with this course but it can be obtained from the National Association of Insurance and Financial Advisors-Florida (NAIFA-Florida), PO Box 14365, Tallahassee, FL 32317. (850) 422-1701, or may be ordered online at <a href="http://naifa-florida.org/" target="_blank" rel="noopener"><strong>http://naifa-florida.org</strong></a>. The Study Manual is also available in Spanish.'},
    {p:'<strong>By clicking the "I Agree" button below, I acknowledged the above information.</strong>'}
  ]}],
  fields:[],
  note:'Florida has English and Spanish versions of this notice: the English version is attached to English courses, and the Spanish version to Spanish courses.'
};
FORMS.FL_LH_ES={
  docHeader:'Florida Pre-Course Notice for Life and Health',
  title:'Florida Pre-Course Notice for Life and Health',
  lang:'es',
  agreeLabel:'Acepto',
  source:'Word doc · FL PE-Pre Course Notice-LifeHealth (Spanish section)',
  pages:[{blocks:[
    {p:'El Departamento de Servicios Financieros de Florida exige un manual de estudio para los cursos de vida y/o salud, NAIFA Salud y Vida (incluyendo Anualidades y Contratos Variables). El examen de licencia estatal relacionado se basará en la última edición del Manual de estudio de vida, salud y anualidades variables de Florida. El Manual de estudio no está incluido en este curso, pero se puede obtener en la Asociación Nacional de Asesores Financieros y de Seguros de Florida (NAIFA-Florida), PO Box 14365, Tallahassee, FL 32317. (850) 422-1701, o se puede solicitar en línea en <a href="http://naifa-florida.org/" target="_blank" rel="noopener"><strong>http://naifa-florida.org</strong></a>. El Manual de estudio también está disponible en español.'},
    {p:'<strong>Al seleccionar el botón "Acepto" a continuación, reconozco la información anterior.</strong>'}
  ]}],
  fields:[],
  note:'Florida has English and Spanish versions of this notice: the English version is attached to English courses, and the Spanish version to Spanish courses. The Spanish modal title and the Link out intro line are still in English until a Spanish version is provided.'
};
FORMS.FL_PC_EN={
  docHeader:'Florida Pre-Course Notice for Property & Casualty',
  title:'Florida Pre-Course Notice for Property & Casualty',
  source:'Word doc · FL PE-Pre Course Notice-PropertyCasualty (English section)',
  pages:[{blocks:[
    {p:'The Florida Department of Financial Services requires a study manual for the General Lines courses, FAIA\'s Florida General Lines, Adjuster and Industrial Fire Study Manual. The related state licensing examination will be based upon the latest edition of the Florida General Lines, Adjuster and Industrial Fire Study Manual. The Study Manual is not included with this course and can be obtained from the Florida Association of Insurance Agents (FAIA), 3159 Shamrock South, Tallahassee, Florida 32309 (850) 893-4155, or may be ordered online at <a href="http://www.faia.com/" target="_blank" rel="noopener"><strong>www.faia.com</strong></a>'},
    {p:'<strong>By clicking the "I Agree" button below, I acknowledged the above information.</strong>'}
  ]}],
  fields:[],
  note:'Florida has English and Spanish versions of this notice: the English version is attached to English courses, and the Spanish version to Spanish courses.'
};
FORMS.FL_PC_ES={
  docHeader:'Florida Pre-Course Notice for Property & Casualty',
  title:'Florida Pre-Course Notice for Property & Casualty',
  lang:'es',
  agreeLabel:'Acepto',
  source:'Word doc · FL PE-Pre Course Notice-PropertyCasualty (Spanish section)',
  pages:[{blocks:[
    {p:'El Departamento de Servicios Financieros de Florida exige un manual de estudio para los cursos de vida y/o salud, NAIFA Salud y Vida (incluyendo Anualidades y Contratos Variables). El examen de licencia estatal relacionado se basará en la última edición del Manual de estudio de vida, salud y anualidades variables de Florida. El Manual de estudio no está incluido en este curso, pero se puede obtener en la Asociación Nacional de Asesores Financieros y de Seguros de Florida (NAIFA-Florida), PO Box 14365, Tallahassee, FL 32317. (850) 422-1701, o se puede solicitar en línea en <a href="http://naifa-florida.org/" target="_blank" rel="noopener"><strong>http://naifa-florida.org</strong></a>. El Manual de estudio también está disponible en español.'},
    {p:'<strong>Al seleccionar el botón "Acepto" a continuación, reconozco la información anterior.</strong>'}
  ]}],
  fields:[],
  note:'Florida has English and Spanish versions of this notice: the English version is attached to English courses, and the Spanish version to Spanish courses. Heads-up: the Spanish text in this Word doc is the Life & Health notice (NAIFA manual), not a Property & Casualty one. It is shown exactly as provided until a corrected version arrives.'
};
FORMS.CA_PRE={
  docHeader:'CA Terms and Conditions',
  title:'CA Terms and Conditions',
  agreeLabel:'I Attest',
  source:'Word doc · CA PE-Pre-Course Terms and Conditions',
  pages:[
    {blocks:[
      {h:'Acknowledgment of Terms and Conditions of Pre-licensing Course Completion'},
      {p:'This course is designed to fulfill the mandatory one time 12-hour Ethics and California Insurance Code education requirement. XCEL Solutions will be tracking your time spent studying in the course. STUDYING MATERIALS OFFLINE DOES NOT COUNT TOWARDS THE TIME REQUIREMENT. You will not be issued a Certificate of Completion until you certify that you have met the minimum time requirements.'},
      {p:'Please note that according to the insurance code regulating pre-licensing education, you will be signed out of your course after 20 minutes of inactivity. Any time accumulated during the period of inactivity will be removed from your study history. Additionally, you must save your progress periodically to ensure your time is counted towards your study history. If you are timed out of a study session without having saved your progress, any time accumulated between the last time you saved your progress, and the time-out will not be included in your study history.'},
      {p:'Any student caught attempting to manipulate or falsify study time will be subject to account suspension pending further investigation. We reserve the right to share student study history with the state\'s Department of Insurance in the event of a suspected regulatory violation or upon the request of the Department.'}
    ]},
    {blocks:[
      {h:'NEW INSURANCE FRAUD TRAINING REGULATION'},
      {p:'The California Department of Insurance (CDI) recently approved the Commissioner-appointed Curriculum Board\'s proposed revisions to the 12-Hour Ethics and California Insurance Code Educational Objectives (EO) to incorporate one hour of study on insurance fraud. This one-hour insurance fraud training is a part of, and not in addition to, the 12-hour prelicensing ethics and three-hour ethics training requirement. The DOI\'s Enforcement Branch-Fraud Division recently launched a one-hour insurance fraud course called "Agents and Brokers Anti-Fraud Training" to meet this new ethics requirement.'},
      {p:'<strong>IMPORTANT:</strong> This course includes the new CA DOI requirement.'}
    ]}
  ],
  fields:[FORMS.KY_PRE.fields[1],FORMS.KY_PRE.fields[2],FORMS.KY_PRE.fields[0]],
  flagFields:['agree'],
  note:'The doc’s button reads "Attest"; the explorer shows "I Attest" instead. Student Name is split into the same name fields as the other states. The "I confirm that the above information is accurate" checkbox (highlighted in red) comes after the name fields.'
};
FORMS.FL_EXAM={
  docHeader:'Florida Prelicensing Course Affidavit',
  title:'Florida Prelicensing Course Affidavit',
  source:'Word doc · FL PE-Pre Final Affidavit',
  pages:[{blocks:[
    {p:'By submitting this form, the undersigned student acknowledges that the online course examination must be completed unassisted by any person, the course material or other materials. The student also acknowledges that a violation of these standards shall result in loss of course credit and administrative sanction by the Florida Department of Financial Services.'},
    {p:'The student further declares that he/she has been actively engaged in one-hundred percent of the online pre-licensing course, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.'}
  ]}],
  fields:[FORMS.KY_PRE.fields[1],FORMS.KY_PRE.fields[2],
    {id:'sig',label:'Student Signature',required:true,placeholder:'Type your full name',ac:'name'},
    {id:'date',type:'date',label:"Today's Date",required:true},
    {block:{p:'The date on this affidavit is the course completion date.'}},
    FORMS.KY_PRE.fields[0]],
  flagFields:['agree'],
  agreeLabel:'I Attest and Confirm',
  note:'Student First and Last Name are shown with the same name fields as the other states (Middle Name and Suffix optional). The button reads "I Attest and Confirm". The "I confirm that the above information is accurate" checkbox (highlighted in red) is the last field.'
};
FORMS.MN_EXAM={
  docHeader:'Minnesota Prelicensing Education Insurance',
  title:'Minnesota Prelicensing Education Insurance: Proctor Acknowledgement and Student Attestation',
  source:'Word doc · MN PE-Pre Final Affidavit',
  pages:[
    {blocks:[
      {p:'<strong>THIS EXAM MUST BE MONITORED BY A DISINTERESTED THIRD PARTY PROCTOR</strong>'},
      {h:'Definition of a Proctor:'},
      {p:'<strong>45.25 DEFINITIONS.</strong>'},
      {p:'Subd. 12.Proctor'},
      {p:'a. "Proctor" means a person who (1) verifies a student\'s identity, and (2) processes an affidavit testifying that the the student received no outside assistance with the course or the examination. A proctor must not be:'},
      {ol:['a relative of the student;','the student\'s supervisor at work;','a person the student supervises at work; or','a student who is completing the same course.']},
      {p:'An acceptable proctor would not be: friends, family members, or individuals with any personal or financial interest in the student\'s success on the exam.'},
      {p:'The exam will reset if you exit the exam without completing it.'}
    ]},
    {blocks:[
      {h:'Proctor Information and responsibilities:'},
      {p:'A proctor is a disinterested third party with no conflict of interest that must verify the identity of the student listed above (i.e., valid photo ID). The proctor must personally observe the completion of the self-study course exam to ensure it is completed without outside assistance of any kind (i.e., human, study material, notes, computer, cell phone, etc.) and physically monitor the student throughout the entire exam process and complete the POST FINAL affidavit.'}
    ]},
    {blocks:[
      {h:'Student Attestation:'},
      {p:'I declare that I will personally complete this exam with no assistance from any person(s), course material, or any additional source of information. This exam will be monitored by a proctor who is an impartial, disinterested third party or currently licensed agent with no family or financial relationship to me. Membership in a professional association/organization does not constitute a financial relationship.'},
      {p:'I also understand that the proctor and myself will be required to complete the <strong>POST FINAL affidavit.</strong>'},
      {h:'Student E-Signature:'}
    ]}
  ],
  fields:[FORMS.KY_PRE.fields[1],FORMS.KY_PRE.fields[2],{id:'date',type:'date',label:"Today's Date",required:true},FORMS.KY_PRE.fields[0]],
  flagFields:['agree'],
  noPrefill:['first','middle','last','suffix'],
  note:'The student’s typed name acts as the signature (the doc’s "Student E-Signature" heading is dropped, 2026-11-09); the doc has no separate signature line. In Link out, the Student Attestation is in the linked document only (2026-11-10). Because the typed name is the signature, the name fields are not pre-filled. The "I confirm that the above information is accurate" checkbox (highlighted in red) is the last field.'
};
FORMS.CA_POST_LH={
  docHeader:'California Prelicensing Affidavit',
  title:'California Prelicensing Affidavit',
  source:'Word doc · CA PE-Post Final Affidavit',
  pages:[{blocks:[
    {p:'By submitting this form, the undersigned student declares, under penalty of perjury, that he/she has completed the online pre-licensing study course for California in preparation for the licensing examination in that state, including completion of at least 52 hours for the Life and Health Insurance including Ethics and Anti-Fraud course.'},
    {p:'The student further declares that he/she has been actively engaged in one hundred percent of the online pre-licensing course, has completed the total number of required training hours identified above, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.'}
  ]}],
  fields:[
    /* CHANGED FROM THE DOCUMENT (2026-11-09, Afsana): no red box round the
       name, and no "Student Legal Name (first and last name)" heading — the
       Legal First / Middle / Last Name labels say it. */
    FORMS.KY_PRE.fields[1],FORMS.KY_PRE.fields[2],
    {id:'sig',label:'Student Signature',required:true,placeholder:'Type your full name',ac:'name'},
    {id:'date',type:'date',label:"Today's Date",required:true},
    {block:{p:'The date on this affidavit is the course completion date.'}},
    /* CHANGED FROM THE EXPLORER (2026-11-04, Afsana): the "Course Completion
       Roster upload form" heading is gone; the sentence and fields stay. */
    /* 2026-11-06, Afsana: the compliance sheet's SSN wording replaces "Education providers are required to collect and report …". */
    {block:{p:SSN_REASON}},
    {id:'dob',type:'date',label:'Date of Birth',required:true,ac:'bday'},
    {id:'ssn4',label:'Last four of SSN',required:true,placeholder:'0000',inputmode:'numeric',maxlength:4,digits:4,ac:'off'},
    FORMS.KY_PRE.fields[0]
  ],
  flagFields:['agree'],
  agreeLabel:'I Attest and Confirm',
  note:'Includes the Course Completion Roster section (date of birth and last four of SSN) from the same Word doc. Only the Life & Health version has been provided so far. The button reads "I Attest and Confirm". The "I confirm that the above information is accurate" checkbox is the last field.'
};
FORMS.IL_POST={
  docHeader:'Illinois Life Prelicensing Affidavit',
  title:'Illinois Life Prelicensing Affidavit',
  source:'Word doc · IL PE-Post Final Affidavit',
  pages:[{blocks:[
    {p:'I affirm that I personally completed the entire study material of the course including one hundred percent of the online pre-licensing course and the mandatory 7.5-hour webinar course. I also affirm that I completed the comprehensive final exam unassisted by any person(s), course materials or other materials.'},
    {p:'I further acknowledge that a violation of these standards shall result in loss of course credit and administrative sanction by the Illinois Department of Insurance.'}
  ]}],
  fields:[
    FORMS.KY_PRE.fields[1],FORMS.KY_PRE.fields[2],
    {id:'sig',label:'Student Signature',required:true,placeholder:'Type your full name',ac:'name'},
    {id:'date',type:'date',label:"Today's Date",required:true},
    {block:{p:'The date on this affidavit is the course completion date.'}},
    /* CHANGED FROM THE EXPLORER (2026-11-04, Afsana): the roster section's
       "Course Completion Roster upload form" heading is gone, and so is the
       red box (a `flagGroup`) around it; the sentence and the Full SSN field
       stay, in the order they were. */
    /* 2026-11-06, Afsana: the compliance sheet's SSN wording replaces "Education providers are required to collect and report …". */
    {block:{p:SSN_REASON}},
    {id:'ssn',label:'Full SSN',required:true,placeholder:'000-00-0000',inputmode:'numeric',maxlength:11,digits:9,ac:'off'},
    FORMS.KY_PRE.fields[0]
  ],
  flagFields:['agree'],
  agreeLabel:'I Attest and Confirm',
  note:'Includes the Course Completion Roster section (full SSN) from the same Word doc. Full SSN must be 9 digits; dashes are allowed. The button reads "I Attest and Confirm". The "I confirm that the above information is accurate" checkbox comes after the roster section.'
};
FORMS.OH_POST_P={
  docHeader:'Ohio Property Pre-Licensing Insurance Affidavit',
  title:'Ohio Property Pre-Licensing Insurance Affidavit',
  source:'Word doc · OH PE-Pre & Post Final Affidavit',
  pages:[{blocks:[
    {p:'I declare that I personally completed the entire study material of the course including one hundred percent of the online pre-licensing course. I also declare that I completed the comprehensive final exam unassisted by any person(s), course material or other materials.'},
    {p:'I further acknowledge that a violation of these standards shall result in loss of course credit and administrative sanction by the Ohio Department of Insurance.'}
  ]}],
  /* No red box (2026-11-09, Afsana); the whole form was a `flagGroup`. */
  fields:[
      {block:{h4:'Student E-Signature:'}},
      FORMS.KY_PRE.fields[1],FORMS.KY_PRE.fields[2],
      {id:'examdate',type:'date',label:'Date Exam was completed',required:true},
      /* 2026-11-06, Afsana: the compliance sheet's SSN wording, above the field. */
      {block:{p:SSN_REASON}},
      {id:'ssn4',label:'Last 4 of SSN',required:true,placeholder:'0000',inputmode:'numeric',maxlength:4,digits:4,ac:'off'},
      {id:'phone',type:'tel',label:'Phone Number',required:true,placeholder:'(555) 000-0000',ac:'tel'},
      {id:'date',type:'date',label:"Today's Date",required:true},
      {block:{p:'The date on this affidavit is the course completion date.'}},
      FORMS.KY_PRE.fields[0]
  ],
  noPrefill:['first','middle','last','suffix'],
  lock:['examdate'],
  note:'Internal note from the Word doc: this one form is used for both the pre- and post-final affidavit because of the different lines of authority. Ohio rule says both can’t be on one form, and OCD can’t attach 2 post-final affidavits. Only the Property version has been provided so far. The name fields are the e-signature, so they are not pre-filled. Date Exam was completed is pre-filled and locked.'
};
FORMS.NY_POST={
  docHeader:'New York Pre-Licensing Post Final Affidavit',
  title:'New York Pre-Licensing Post Final Affidavit',
  agreeLabel:'I Attest',
  source:'Word doc · NY PE-Post Final Affidavit',
  pages:[{blocks:[
    {p:'By clicking the button below, I certify that I completed the exam independently, without assistance from another person, course materials, notes, internet resources, AI tools, or any other unauthorized source. The answers submitted are my own.'},
    {p:'The student also acknowledges that a violation of these standards shall result in loss of course credit and administrative sanction by the New York Department of Financial Services Insurance Department.'},
    {p:'The student further declares that he/she has been actively engaged in one-hundred percent of the online pre-licensing course, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.'}
  ]}],
  fields:[
    {block:{h4:'Student E-Signature:'}},
    /* One field, as the document has it (2026-11-04); it was First / Middle / Last / Suffix. */
      {id:'fullname',label:'Full Name',required:true,placeholder:'Type your full name',ac:'name'},
    {id:'date',type:'date',label:"Today's Date",required:true},
    FORMS.KY_PRE.fields[0]
  ],
  flagFields:['agree'],
  noPrefill:['fullname'],
  note:'The doc’s button reads "Attest"; the explorer shows "I Attest" instead. The "I confirm that the above information is accurate" checkbox (highlighted in red) comes after Today’s Date. Full Name is split into the same name fields as the other states. The name fields are the e-signature, so they are not pre-filled.'
};
FORMS.CO_POST={
  docHeader:'Colorado Pre-licensing Insurance',
  title:'Colorado Pre-licensing Insurance - Affidavit of Personal Responsibility',
  source:'Word doc · CO PE-Post Final Affidavit',
  /* "Must be completed and signed by exam monitor" — the banner names the
     document's word for the proctor, and "signed" when they sign (2026-11-10). */
  proctorWord:'exam monitor',
  pages:[
    {who:'student',blocks:[],fields:[
      {id:'course',label:'Course Name',required:true,placeholder:'Course name'},
      {id:'examdate',type:'date',label:'Date of Pre-licensing Final Exam',required:true},
      {block:{p:'I affirm that I personally completed the entire study material of the course. I also affirm that I completed the exam without assistance from any course material, other than source material, or from any person(s).'}},
      /* The document's "Student Signature:" heading is gone (2026-11-09, Afsana); CT follows, being a copy. */
      /* One field, as the document has it (2026-11-04); it was First / Middle / Last / Suffix. */
      {id:'fullname',label:'Student Full Name',required:true,placeholder:'Type your full name',ac:'name'},
      {id:'date',type:'date',label:'Date',required:true},
      FORMS.KY_PRE.fields[0]
    ]},
    /* The underlined "To be completed and Signed by Exam Monitor" heading is gone (2026-11-09, Afsana): the banner above says it. */
    {who:'proctor',blocks:[],fields:[
      {id:'rel',type:'radio',label:'Relationship to Examinee',required:true,options:['Co-Worker (neither above or below the line of supervision)','Librarian','Licensed Agent']},
      /* One line, as the document has it (2026-11-04); it was Address Line 1 / 2, City, State and Zip. */
      {id:'p_addr',label:'Proctor Address',required:true,placeholder:'Street address, city, state, zip code',ac:'off',help:'street address, city, state, zip code'},
      {block:{p:'I certify that I verified the identification of the student. In addition, I administered the final examination and certify that it was sealed until administration and completed without assistance or outside assistance of any kind.'}},
      {id:'p_name',label:'Proctor Name (print)',required:true,placeholder:'Proctor full name'},
      {id:'p_sig',label:'Proctor Signature',required:true,placeholder:'Proctor types full name'}
    ]},
    {who:'student',blocks:[
      {h:'Student Certification Statement:'},
      {p:'By submitting this form, I certify that, under the penalty of perjury, I am the person listed above and that my completion of each assignment in this course was the result of my own personal efforts, unassisted by any unauthorized individual or resource, and my work has not been altered or tampered with in any way. I understand that receiving unauthorized assistance or tampering with course results will invalidate my course credit and may be a cause of action under applicable laws and regulations sanctioned by the Colorado Division of Insurance.'}
    ]}
  ],
  fields:[],
  flagFields:['agree'],
  noPrefill:['fullname'],
  lock:['examdate','course'],
  noLink:true,
  note:'Three parts: the student’s affirmation, the exam monitor (proctor) section, and the Student Certification Statement. The doc’s "Circle one" relationship becomes radio buttons, and the one-line proctor address is split into address fields. The "I confirm that the above information is accurate" checkbox (highlighted in red) sits right above the Exam Monitor section. In Pagination, Next also waits for that page’s required fields. The name fields are the student signature, so they are not pre-filled. Course Name and Date of Pre-licensing Final Exam are pre-filled and locked. No Link out option: the student and proctor complete many fields, so the form is always shown in full.'
};
FORMS.CT_POST=(function(){
  const c=JSON.parse(JSON.stringify(FORMS.CO_POST));
  c.docHeader='Connecticut Pre-licensing Insurance';
  c.title='Connecticut Pre-licensing Insurance - Affidavit of Personal Responsibility';
  c.source='Word doc · CT PE-Post Final Affidavit';
  {const d=c.pages[0].fields.find(x=>x.id==='examdate');d.label='Date of Prelicensing Final Exam';} // its "mm/dd/yyyy" hint went 2026-11-09 (Afsana)
  const cert=c.pages[2].blocks[1];cert.p=cert.p.replace('Colorado Division of Insurance','Connecticut Department of Insurance');
  c.note='Same structure as Colorado’s affidavit: the student’s affirmation, the exam monitor (proctor) section, and the Student Certification Statement. The doc’s "Circle one" relationship becomes radio buttons, and the one-line proctor address is split into address fields.';
  c.note+=' The "I confirm that the above information is accurate" checkbox (highlighted in red) sits right above the Exam Monitor section.';
  c.note+=' Course Name and Date of Prelicensing Final Exam are pre-filled and locked. No Link out option: the student and proctor complete many fields, so the form is always shown in full.';
  return c;
})();
(function(){
  const ST='AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
  /* The standard five address fields, for an address that is not the learner's own (2026-11-10). */
  const stdAddr=(pre)=>[
    {id:pre+'addr1',label:'Address Line 1',required:true,placeholder:'Street address',ac:'off'},
    {id:pre+'addr2',label:'Address Line 2 (Optional)',placeholder:'Apt, suite, unit, etc.',ac:'off'},
    {id:pre+'city',label:'City',required:true,placeholder:'City',ac:'off'},
    {id:pre+'state',type:'select',label:'State',required:true,placeholder:'Select state',ac:'off',options:ST},
    {id:pre+'zip',label:'Zip',required:true,placeholder:'ZIP code',ac:'off',inputmode:'numeric'}];
  FORMS.MN_POST={
  docHeader:'Generic Document',
  title:'Pre-License Course EXAM Proctor Affidavit',
  source:'PDF · MN PE-Post Final Affidavit (Generic Document, Rev 1.17.23)',
  pages:[
    /* ⚑ 2026-11-10, Afsana — MINNESOTA AFTER THE EXAM, BROUGHT INTO LINE WITH
       OCD AND THE STANDARD FIELDS. No "Student / Licensee Name and
       Certification" or "Student’s Full Legal Name, License Number, & DOB"
       headings. Date & Time of Exam Completion is two fields, both pre-filled
       and locked. Where the exam was completed: OCD's "Address where exam
       was completed" heading over the standard five address fields (OCD:
       address, city, state, zip). The student's Business Address is the
       student's standard address, pre-filled (OCD: student address, city,
       state, zip). No Mailing Address (OCD has none). Phone Number, Email
       Address and Today's Date, the standard labels. License # stays —
       OCD does not collect it, and nobody yet knows why. */
    {who:'student',blocks:[],fields:[
      {id:'examname',label:'Name of Exam',readonly:true,value:'Certification Exam -Minnesota Life Prelciensing'},
      {row:[{id:'examdate',type:'date',label:'Exam Completion Date',required:true},{id:'examtime',type:'time',label:'Time of Exam Completion',required:true}]},
      {block:{h4:'Address where exam was completed'}},
      ...stdAddr('loc_'),
      {id:'name',label:'Name',required:true,placeholder:'Full legal name',ac:'name',sameAs:'fullname'},
      {row:[{id:'license',label:'License #',required:true,placeholder:'License number'},{id:'dob',type:'date',label:'Date of Birth',required:true,ac:'bday'}]},
      ...['addr1','addr2','city','state','zip'].map((id)=>FORMS.KY_PRE.fields.find((x)=>x.id===id)),
      {row:[{id:'phone',type:'tel',label:'Phone Number',required:true,placeholder:'(555) 000-0000',ac:'tel'},{id:'email',type:'email',label:'Email Address',required:true,placeholder:'Enter email address',ac:'email'}]},
      {block:{p:'<em><strong>I certify that I personally completed the above-named exam without outside assistance of any kind.</strong></em>'}},
      {id:'sig',label:'Student Signature',required:true,placeholder:'Type your full name',ac:'name'},
      {id:'sigdate',type:'date',label:"Today's Date",required:true},
      FORMS.KY_PRE.fields[0]
    ]},
    /* The proctor's side (2026-11-10, Afsana): no "Proctor Name and
       Certification" heading. Relationship to Examinee is OCD's three
       choices, as radio buttons the way Colorado's are, without OCD's
       "(check one)". No Employer & Job Title (OCD has none). The address is
       the standard five fields (OCD: proctor address, city, state, zip). Today's
       Date is ours — OCD has no date for the exam monitor — pre-filled and
       locked. ⚠ OPEN: OCD collects neither License # nor the proctor's
       e-mail. Kept (as License # and Email Address) until it is decided
       whether to keep them, make them optional, or drop them as OCD does. */
    {who:'proctor',blocks:[],fields:[
      {id:'p_name',label:'Proctor’s Full Legal Name',required:true,placeholder:'Proctor full legal name'},
      {id:'p_rel',type:'radio',label:'Relationship to Examinee',required:true,options:['Co-Worker (neither above or below the line of supervision)','Librarian','Neighbor']},
      {block:{p:'I certify that I am at least 18 years of age, with no financial or other conflict of interest with respect to a student’s successful completion of the examination. I verified the identity of the student listed above on this form (i.e. valid photo ID), and I ensured that the exam was completed without outside assistance of any kind (i.e. human, study material, notes, computer, cell phone, etc.), and that I physically monitored the student throughout the entire exam process.'}},
      {id:'p_sig',label:'Proctor Signature',required:true,placeholder:'Proctor types full name'},
      {id:'p_date',type:'date',label:"Today's Date",required:true,sameAs:'sigdate'},
      {id:'p_addr',label:'Address',required:true},
      {row:[{id:'p_phone',type:'tel',label:'Phone Number',required:true,placeholder:'(555) 000-0000'},{id:'p_email',type:'email',label:'Email Address',required:true,placeholder:'Enter email address'}]}
    ]}
  ],
  fields:[],
  flagFields:['agree'],
  lock:['examdate','examtime','p_date'],
  note:'This is a generic proctor affidavit (Rev 1.17.23) with "Name of Exam" pre-filled for Minnesota Life, shown read-only. Two pages: the student’s section, then the proctor’s. Since 2026-11-10 its fields follow OCD and the standard fields, not the PDF: no Mailing Address and no Employer & Job Title. The "I confirm that the above information is accurate" checkbox ends the student section. Exam Completion Date and Time of Exam Completion are pre-filled and locked. The proctor’s Today’s Date is pre-filled to match the student’s and locked.'
  };
})();
FORMS.WV_POST={
  docHeader:'West Virginia Pre-licensing Insurance',
  title:'West Virginia Pre-licensing Insurance - Affidavit of Personal Responsibility',
  agreeLabel:'Attest',
  source:'Word doc · WV PE-Post Final Affidavit',
  pages:[
    {who:'student',blocks:[{h:'TO BE COMPLETED BY THE STUDENT'}],fields:[
      {block:{p:'I declare that I completed the exam with no assistance from any person(s), course material, or any additional source of information. This exam will be proctored by an approved proctor who is an impartial, disinterested third party with no financial relationship to the student.'}},
      {block:{h4:'Student E-Signature:'}},
      /* One field, as the document has it (2026-11-04); it was First / Middle / Last / Suffix. */
      {id:'fullname',label:'Student Full Name',required:true,placeholder:'Type your full name',ac:'name'},
      FORMS.KY_PRE.fields[0]
    ]},
    {who:'proctor',blocks:[{h:'TO BE COMPLETED BY THE PROCTOR'}],fields:[
      {block:{p:'I certify that I am at least 18 years of age and a disinterested third party with no conflict of interest. A disinterest 3rd party is an individual with no family relationship or financial interest in the examinee\'s success on the exam. Co-work proctors must not be above or below in the student\'s line of supervision. I verified the identity of the student listed above on this form (i.e. valid photo id), and ensured that the exam was completed without outside assistance of any kind (i.e. human, study material, notes, computer, cell phone, etc.) and that I physically monitored the student throughout the entire exam process.'}},
      {id:'rel',type:'radio',label:'Relationship to Examinee',required:true,options:['Co-Worker (neither above or below the line of supervision)','Librarian','Licensed Agent']},
      {block:{h4:'Proctor E-Signature:'}},
      {id:'p_name',label:'Proctor Full Name',required:true,placeholder:'Proctor full name'},
      {id:'date',type:'date',label:"Today's Date",required:true}
    ]},
    {who:'student',blocks:[
      {h:'Student Certification Statement:'},
      {p:'By clicking the button below, I certify that, under the penalty of perjury, I am the person listed above and that my completion of each assignment in this course was the result of my own personal efforts, unassisted by any unauthorized individual or resource, and my work has not been altered or tampered with in any way. I understand that receiving unauthorized assistance or tampering with course results will invalidate my course credit and may be a cause of action under applicable laws and regulations sanctioned by the West Virginia Offices of the Insurance Commissioner.'}
    ]}
  ],
  fields:[],
  flagFields:['agree'],
  noPrefill:['fullname','date'],
  note:'Same three-part structure as CO and CT (student, proctor, certification statement). The button reads "Attest". The doc’s "check one" relationship becomes radio buttons. The "I confirm that the above information is accurate" checkbox (highlighted in red) ends the student section. The name fields are the e-signature, so they are not pre-filled.'
};
FORMS.WI_POST={
  docHeader:'Wisconsin Pre-licensing Insurance',
  title:'Wisconsin Pre-licensing Insurance Affidavit of Personal Responsibility',
  agreeLabel:'Attest',
  source:'Word doc · WI PE-Post Final Affidavit',
  proctorWord:'exam monitor',
  pages:[
    {who:'student',blocks:[{p:'I affirm that I personally completed the entire study material of the course. I also affirm that I completed the exam without assistance from any course material, other than source material, or from any person(s).'}],fields:[
      {block:{h4:'Student E-Signature:'}},
      /* One field, as the document has it (2026-11-04); it was First / Middle / Last / Suffix. */
      {id:'fullname',label:'Student Full Name',required:true,placeholder:'Type your full name',ac:'name'},
      {id:'s_date',type:'date',label:"Today's Date",required:true},
      FORMS.KY_PRE.fields[0]
    ]},
    {who:'proctor',blocks:[{h:'To be completed and signed by Exam Monitor'}],fields:[
      {id:'p_addr',label:'Proctor Full Address',required:true,placeholder:'Street, city, state, ZIP',ac:'street-address'},
      {id:'p_phone',type:'tel',label:'Phone Number',required:true,placeholder:'(555) 000-0000',ac:'tel'},
      {block:{p:'I declare that I personally observed the above-named individual during the completion of this examination and also observed that the candidate received no outside assistance in completing the examination. I attest that as an approved proctor I am an impartial disinterested third party or currently licensed agent with no family or financial relationship to the student per section Ins. 26.09 (3), Wis. Adm. Code.'}},
      {block:{h4:'Proctor E-Signature:'}},
      {id:'p_name',label:'Proctor Full Name',required:true,placeholder:'Proctor full name'},
      {id:'rel',type:'radio',label:'Relationship to Examinee',required:true,options:['Co-Worker (neither above or below the line of supervision)','Librarian','Neighbor']},
      {id:'date',type:'date',label:"Today's Date",required:true}
    ]},
    {who:'student',blocks:[
      {h:'Student Certification Statement:'},
      {p:'By clicking the button below, I certify that, under the penalty of perjury, I am the person listed above and that my completion of each assignment in this course was the result of my own personal efforts, unassisted by any unauthorized individual or resource, and my work has not been altered or tampered with in any way. I understand that receiving unauthorized assistance or tampering with course results will invalidate my course credit and may be a cause of action under applicable laws and regulations of my state.'}
    ]}
  ],
  fields:[],
  flagFields:['agree'],
  noPrefill:['fullname','date'],
  note:'Same three-part structure as WV (student, exam monitor, certification statement). The button reads "Attest". Student Full Name becomes the First/Middle/Last/Suffix rows; the doc’s "check one" relationship becomes radio buttons. Unlike WV, the proctor also gives an address and phone number, and the options include Neighbor instead of Licensed Agent. The "I confirm that the above information is accurate" checkbox (highlighted in red) ends the student section. The name fields are the e-signature, so they are not pre-filled.'
};

/* Before course begins: the confirm checkbox goes after the last student field (Today's Date), just above the
   Compliance Manager signature. Done here, after every form has grabbed KY_PRE.fields[0..2] by index. NV shares this array.
   (The explorer's own fix-up, kept as it is.) */
{const f=FORMS.KY_PRE.fields,a=f.shift()!;f.splice(f.findIndex(x=>x.id==='cmsig'),0,a);}

/* ── NON-STATE SPECIFIC — added 2026-11-04, not in the explorer ────────────
   Afsana: "when affidavit state = non-state specific, add modal for xcel
   generic terms and conditions (before course begins) and a general
   attestation (before the course exam)". From her "Non-State Specific"
   folder: XCEL Generic Terms and Conditions-Pre-Course Affidavit.docx and
   XCEL PE General Pre-Final Attestation.docx, in their words, their bold and
   their underline. `GEN` is a pseudo-state: the Design bar's State control
   lists it last as "Non-state specific". There is no after-exam form — the
   attestation itself says the learner and proctor complete the state's POST
   FINAL affidavit.

   Like the state forms, a typed Student Full Name is the signature, so it is
   not pre-filled; and with nothing else pre-filled there is no "I confirm
   that the above information is accurate" box. The terms come in English and
   Spanish, one after the other in the document; the Design bar's Language
   picks one, as it does for Florida's notices. */
STATES.GEN = 'Non-state specific'
ENTRIES.push(
  {m:'pre',doc:'terms',st:'GEN',status:'ready',byLanguage:{English:'GEN_PRE_EN',Spanish:'GEN_PRE_ES'}},
  {m:'exam',st:'GEN',status:'ready',form:'GEN_EXAM'},
)
FORMS.GEN_PRE_EN={
  docHeader:'XCEL Generic Terms and Conditions (Non-State Specific)',
  title:'XCEL Generic Terms and Conditions',
  source:'Word doc · XCEL Generic Terms and Conditions-Pre-Course Affidavit (English section)',
  pages:[
    {blocks:[
      {h:'Acknowledgement of Terms and Conditions of Pre-licensing Course Completion'},
      {p:'I understand and acknowledge that the pre-licensing insurance course final exam must be a proctored, closed-book exam with no assistance provided. A disinterested third party must proctor the exam. <strong>The disinterested third-party proctor or monitor is an individual who has <u>none</u> of the following: </strong>family relationship with the student; is a direct supervisor of the student; or a person directly supervised by the student.'},
      {p:'A certificate of course completion is to be presented to the student who successfully passes the exam with a score of 70% or better within 2 days of the completion date. The pre-licensing course completion date is the date the proctor signs and dates the exam.'}
    ]}
  ],
  fields:[
    {id:'fullname',label:'Student Full Name',required:true,placeholder:'Type your full name',ac:'name'}
  ],
  noPrefill:['fullname'],
  note:'Not in the explorer: added 2026-11-04 from the Non-State Specific folder. The document names no button, so it is the default "I Agree".'
};
/* The document's Spanish section (2026-11-04, Afsana: "when set to spanish,
   only show the spanish version … this is what was done for FL"). Like
   Florida's Spanish notices: the title stays the document's, the modal is
   marked Spanish, and the button is "Acepto". The document has one, English
   "Student Full Name" line under both sections, so that label stays. */
FORMS.GEN_PRE_ES={
  docHeader:'XCEL Generic Terms and Conditions (Non-State Specific)',
  title:'XCEL Generic Terms and Conditions',
  lang:'es',
  agreeLabel:'Acepto',
  source:'Word doc · XCEL Generic Terms and Conditions-Pre-Course Affidavit (Spanish section)',
  pages:[
    {blocks:[
      {h:'Reconocimiento de los Términos y Condiciones de la Finalización del Curso de Pre-licencia'},
      {p:'Yo entiendo y reconozco que el examen final del curso de seguro pre-licencia debe ser un examen supervisado y cerrado sin ayuda. Un tercero desinteresado debe supervisar el examen. <strong>El supervisor o monitor de terceros desinteresados es un individuo que no tiene ninguno de los siguientes: relación familiar con el estudiante; es un supervisor directo del estudiante; o una persona directamente supervisada por el estudiante.</strong>'},
      {p:'Un certificado de finalización del curso debe ser presentado al estudiante que pase el examen con una puntuación de 70% o mejor dentro de los 2 días de la fecha de finalización. La fecha de finalización del curso de pre-licencia es la fecha en que el supervisor firma y fecha el examen.'}
    ]}
  ],
  fields:[
    {id:'fullname',label:'Student Full Name',required:true,placeholder:'Type your full name',ac:'name'}
  ],
  noPrefill:['fullname'],
  note:'Not in the explorer: added 2026-11-04 from the Non-State Specific folder. The Spanish section of the same document.'
};
FORMS.GEN_EXAM={
  docHeader:'XCEL PE General Attestation (non-state specific)',
  title:'Prelicensing Education Insurance - Proctor Acknowledgement and Student Attestation', // capitalized 2026-11-10, Afsana
  agreeLabel:'Attest',
  source:'Word doc · XCEL PE General Pre-Final Attestation',
  pages:[
    {blocks:[
      {p:'THIS EXAM MUST BE MONITORED BY A DISINTERESTED THIRD PARTY PROCTOR'},
      {h:'Definition of a Proctor:'},
      {p:'The proctor must be a disinterested third party, with a minimum age of 18 years, who can be any person <strong>except for family members</strong> or individuals who have a financial interest in the success of the student taking the examination. Co-worker proctors must not be above or below in the student’s line of supervision.'},
      {h:'Proctor Information and responsibilities:'},
      {p:'A proctor is a disinterested third party with no conflict of interest that must verify the identity of the student listed above (i.e., valid photo ID). The proctor must personally observe the completion of the self-study course exam to ensure it is completed without outside assistance of any kind (i.e., human, study material, notes, computer, cell phone, etc.) and physically monitor the student throughout the entire exam process and complete the <strong>POST FINAL affidavit.</strong>'}
    ]},
    {blocks:[
      {h:'Student Attestation:'},
      {p:'I declare that I will personally complete this exam with no assistance from any person(s), course material, or any additional source of information. This exam will be monitored by a proctor who is an impartial, disinterested third party or currently licensed agent with no family or financial relationship to me. Membership in a professional association/organization does not constitute a financial relationship.'},
      {p:'I also understand that the proctor and I will be required to complete the <strong>POST FINAL affidavit.</strong>'}
    ]}
  ],
  fields:[
    {block:{h4:'Student E-Signature:'}},
    {id:'fullname',label:'Student Full Name',required:true,placeholder:'Type your full name',ac:'name'}
  ],
  noPrefill:['fullname'],
  note:'Not in the explorer: added 2026-11-04 from the Non-State Specific folder. The button reads "Attest", as the document has it.'
};

/* ── BEFORE THE COURSE EXAM: CO, CT, WV, WI — added 2026-11-04 ───────────
   The explorer had no pre-exam document for these four ("Doc not available
   yet"). ⚠ THE WORDING WAS PROVIDED BY SARAH ON 11/04/26 — one attestation
   for all four — and Sarah confirmed the forms may be titled "<State>
   Pre-Exam Attestation", having no preference on what they are called.
   (Relayed by Afsana; docs/product-app.md, "Affidavit V2", has the same note.)
   The learner confirmed with a checkbox that they read and understood it —
   Afsana's choice over a typed signature — until 2026-11-06, when she took
   that box out ("remove the second checkbox … I have read and understand the
   requirements above"): the button alone attests. Link out keeps its own
   "I have read …" box, as every Link out form does. The button is Florida's pre-exam
   "I Attest and Confirm". Nothing is pre-filled, so there is no "I confirm
   that the above information is accurate" box. */
const PRE_EXAM_ATTESTATION =
  'I attest that I am the individual registered for this examination and that I will complete the exam independently under the supervision of a disinterested third-party proctor. The proctor may not be a family member, employer, subordinate, student, or any individual with a personal or professional interest in the outcome of the examination. I agree to comply with all examination and proctoring requirements and will not use unauthorized materials, devices, resources, artificial intelligence tools, or assistance from any person during the examination. I understand that any violation of these requirements may result in invalidation of exam results, denial of credit, and other disciplinary action.'
for (const st of ['CO', 'CT', 'WV', 'WI']) {
  const key = st + '_EXAM'
  FORMS[key] = {
    docHeader: STATES[st] + ' Pre-Exam Attestation',
    title: STATES[st] + ' Pre-Exam Attestation',
    agreeLabel: 'I Attest and Confirm',
    source: 'Wording provided by Sarah, 11/04/26 · one attestation for CO, CT, WV and WI',
    pages: [{ blocks: [{ p: PRE_EXAM_ATTESTATION }] }],
    fields: [],
    note: 'Not in the explorer, which had no document for this state at this moment.',
  }
  const entry = ENTRIES.find((e) => e.m === 'exam' && e.st === st)
  entry.status = 'ready'
  entry.form = key
}

/* ── BEFORE THE COURSE EXAM: PENNSYLVANIA — added 2026-11-06 ─────────────
   Not in the explorer. It is a row on the compliance team's sheet
   (XCEL-PE_Affidavits_and_EAs.xlsx: "PA PE-Pre Final Affidavit", Final
   Affidavit, Pre, "Affidavit State Form" FALSE), and the Word doc is in the
   _XCEL-PE Affidavits and EAs folder. ⚠ OPEN QUESTION (Afsana, 2026-11-06):
   the sheet and the PRD disagree. The Compliance and Regulatory Data
   Foundations PRD (Confluence, ATLAS space; checked 2026-11-06 against the
   page as last edited 2026-10-20) does not count Pennsylvania among its 19
   regulated states: its tables A10 and A11 say Pennsylvania ELIMINATED
   pre-licensing on 29 Apr 2025, and that the state's licensing tab "still
   says 'student affidavit'". Compliance to say whether XCEL still shows this
   affidavit (the sheet is dated 10/29/2026) before it counts as decided. Fields as the document
   has them — Student E-Signature, one Full Name line, Today's Date — and its
   button, "Attest". Today's Date is pre-filled, so the "I confirm that the
   above information is accurate" box stays, as it does for New York. */
STATES.PA = 'Pennsylvania'
ENTRIES.push({m:'exam',st:'PA',status:'ready',form:'PA_EXAM'})
FORMS.PA_EXAM={
  docHeader:'Pennsylvania Pre-Licensing Affidavit',
  title:'Pennsylvania Pre-Licensing Affidavit',
  agreeLabel:'Attest',
  source:'Word doc · PA PE-Pre Final Affidavit',
  pages:[{blocks:[
    {p:'By submitting this form, the undersigned student acknowledges that the online course examination must be completed unassisted by any person, the course material or other materials. The student also acknowledges that a violation of these standards shall result in loss of course credit and administrative sanction by the Pennsylvania Department of Insurance.'},
    {p:'The student further declares that he/she has been actively engaged in one-hundred percent of the online pre-licensing course, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.'}
  ]}],
  fields:[
    {block:{h4:'Student E-Signature:'}},
    {id:'fullname',label:'Full Name',required:true,placeholder:'Type your full name',ac:'name'},
    {id:'date',type:'date',label:"Today's Date",required:true},
    /* Written out: by this point in the file KY_PRE.fields[0] is a name row, not this box. */
    {id:'agree',type:'checkbox',label:'I confirm that the above information is accurate',required:true}
  ],
  noPrefill:['fullname'],
  note:'Not in the explorer: added 2026-11-06 from the compliance team\'s affidavit sheet. The PRD says Pennsylvania eliminated pre-licensing on 29 Apr 2025; to be confirmed with compliance.'
};

/* ── ONE WAY TO SIGN — 2026-11-06 ────────────────────────────────────────
   The Nov 5 product & design review (Amrita, Nick): signatures are kept the
   same on every form, for audit and reporting, whatever the document calls
   the field ("Student Signature", "Student E-Signature", a Full Name line
   under either). Afsana's call for now: EVERYWHERE A SIGNATURE APPEARS the
   learner sees First Name and Last Name, pre-filled from their account
   (Middle Name too, while the Design bar's "Affidavit middle name" is on —
   undecided) — labelled "Legal First / Middle / Last Name" (Afsana, same day), and an empty Student Signature box to type their name in.
   Suffix goes: no document asks for one.

   What counts as "a signature appears": the document has a signature line or
   a signature label — the 15 forms below. NOT the enrollment agreements (KY,
   NV, OR): their fields are an image at the end of the Word doc (Full Name,
   Residence Address, Phone, Email or Oregon's extra ones, Today's Date, a
   Confirmation button and the XCEL Compliance Manager's signature), with no
   signature for the student. Nor the name-only and nothing-to-fill forms.
   The document's own headings stay (they say where the signature is); the
   names take the place of the document's name field(s), the signature box
   the place of its signature line, or follows the names where it had none.
   Proctor fields are untouched. With the names pre-filled, every one of these
   forms carries the "I confirm that the above information is accurate" box. */
const NAME_ROW: AffField = {row:[
  {id:'first',label:'Legal First Name',required:true,placeholder:'Legal first name',ac:'given-name'},
  {id:'middle',label:'Legal Middle Name',placeholder:'Legal middle name',ac:'additional-name'},
  {id:'last',label:'Legal Last Name',required:true,placeholder:'Legal last name',ac:'family-name'},
]}
const SIGNATURE: AffField = {id:'sig',label:'Student Signature',required:true,placeholder:'Type your full name',ac:'name'}
const CONFIRM: AffField = {id:'agree',type:'checkbox',label:'I confirm that the above information is accurate',required:true}
const NAME_IDS = ['first','middle','last','suffix','fullname','name']
const isName = (x: AffField) => (x.id != null && NAME_IDS.includes(x.id)) || (x.row ?? []).some((y) => y.id != null && NAME_IDS.includes(y.id))
export const SIGNED_FORMS = ['IL_PRE','OH_PRE','FL_EXAM','MN_EXAM','CA_POST_LH','IL_POST','OH_POST_P','NY_POST','CO_POST','CT_POST','MN_POST','WV_POST','WI_POST','GEN_EXAM','PA_EXAM']
/* AND ONE WAY TO TAKE A NAME (2026-11-06, Afsana: "Yes, standardize"). The
   forms that ask for a name but have no signature — California's and the
   generic terms ("Student Name", "Student Full Name") and the KY, NV and OR
   enrollment agreements ("Full Name", in the image of the fields at the end
   of each Word doc) — take the same name block, pre-filled,
   with no signature box. "Full Legal Name", "Full Name" and "Student Name"
   are one data point, the learner's name, so they are captured one way. */
export const NAMED_FORMS = ['CA_PRE','GEN_PRE_EN','GEN_PRE_ES','KY_PRE','NV_PRE','OR_PRE']
for (const key of [...SIGNED_FORMS, ...NAMED_FORMS]) {
  const form = FORMS[key]
  const sign = SIGNED_FORMS.includes(key)
  let named = false, signed = false
  const has = (l: AffField[] | undefined, id: string): boolean => (l ?? []).some((x) => x.id === id || has(x.flagGroup, id) || has(x.row, id))
  // Does the document have its own signature line anywhere (not just in this list)?
  const lineSig = has(form.fields.concat(...form.pages.map((p) => p.fields ?? [])), 'sig')
  const rewrite = (list: AffField[]): AffField[] => list.flatMap((x) => {
    if (x.flagGroup) return [{ ...x, flagGroup: rewrite(x.flagGroup) }]
    if (isName(x)) { if (named) return []; named = true; return [NAME_ROW, ...(lineSig || !sign ? [] : (signed = true, [SIGNATURE]))] }
    if (x.id === 'sig') { if (signed) return []; signed = true; return named ? [SIGNATURE] : (named = true, [NAME_ROW, SIGNATURE]) }
    return [x]
  })
  form.pages = form.pages.map((p) => (p.fields ? { ...p, fields: rewrite(p.fields) } : p))
  form.fields = rewrite(form.fields)
  const all = form.fields.concat(...form.pages.map((p) => p.fields ?? []))
  if (!has(all, 'agree')) form.fields.push(CONFIRM)
  form.noPrefill = (form.noPrefill ?? []).filter((id) => !NAME_IDS.includes(id))
}

/* ── WHOSE FIELDS — 2026-11-09 (Afsana) ──────────────────────────────────
   The state-specific affidavits (the "State Specific Affidavit" folder: the
   six after-exam forms below) split into student and proctor pages, each with
   its "Must be completed by the student / proctor" banner. Every other form —
   all three moments — is the student's alone, so it gets the same student
   banner once, at the top. The banner says whose the fields are, so the
   signature box is plain "Signature", not "Student Signature" — on the
   state-specific forms too, where the student page's banner says it
   (Afsana, same day).
   And no form keeps a "Student E-Signature:" heading: the banner, the name
   block and the signature box already say it. */
export const STATE_SPECIFIC_FORMS = ['CO_POST','CT_POST','MN_POST','NY_POST','WI_POST','WV_POST']
const eSig = (b: AffBlock) => /^Student E-Signature:?$/.test((b.h ?? b.h4 ?? '').trim())
const unsign = (list: AffField[] | undefined): AffField[] | undefined => list?.flatMap((x) => {
  if (x.block && eSig(x.block)) return []
  if (x.block) return [{ ...x, block: fine(x.block) }]
  if (x.flagGroup) return [{ ...x, flagGroup: unsign(x.flagGroup) }]
  if (x.row) return [{ ...x, row: unsign(x.row) }]
  return [x.id === 'sig' ? { ...x, label: 'Signature' } : x]
})
/* ── THE PROCTOR, THE SAME WAY — 2026-11-09 (Afsana) ─────────────────────
   Settles two of the questions that were waiting on Nick and Amrita: the
   proctor's name, signature and address are taken exactly as the student's
   are. Name: Legal First / Middle / Last Name (Middle follows the Design bar's
   "Affidavit middle name"), never pre-filled — the learner's account is not
   the proctor's. Signature: a "Signature" box to type their name in, where
   the document had its signature line (CO, CT, MN) or right after the names
   where it had none (WV, WI — whose "Proctor E-Signature:" heading goes, as
   the student's did). Address: Address Line 1, Address Line 2 (Optional),
   City, State, Zip — CO/CT's one line with its "(street address, city,
   state, zip code)" and WI's "Proctor Full Address" alike, and Minnesota's
   (its "Business Address" heading went 2026-11-10). The proctor banner says whose they are, so these labels do not
   say "Proctor" — nor does WI's "Phone Number" (2026-11-10). */
const P_NAME_ROW: AffField = {row:[
  {id:'p_first',label:'Legal First Name',required:true,placeholder:'Legal first name',ac:'off'},
  {id:'p_middle',label:'Legal Middle Name',placeholder:'Legal middle name',ac:'off'},
  {id:'p_last',label:'Legal Last Name',required:true,placeholder:'Legal last name',ac:'off'},
]}
const P_SIGNATURE: AffField = {id:'p_sig',label:'Signature',required:true,placeholder:'Type your full name',ac:'off'}
const P_ADDRESS: AffField[] = [
  {id:'p_addr1',label:'Address Line 1',required:true,placeholder:'Street address',ac:'off'},
  {id:'p_addr2',label:'Address Line 2 (Optional)',placeholder:'Apt, suite, unit, etc.',ac:'off'},
  {id:'p_city',label:'City',required:true,placeholder:'City',ac:'off'},
  {id:'p_state',type:'select',label:'State',required:true,placeholder:'Select state',ac:'off',options:'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ')},
  {id:'p_zip',label:'Zip',required:true,placeholder:'ZIP code',ac:'off',inputmode:'numeric'},
]
export const PROCTOR_FORMS = Object.keys(FORMS).filter((k) => FORMS[k].pages.some((p) => p.who === 'proctor'))
for (const key of PROCTOR_FORMS) {
  const form = FORMS[key]
  const lineSig = form.pages.some((p) => p.who === 'proctor' && (p.fields ?? []).some((x) => x.id === 'p_sig'))
  form.pages = form.pages.map((p) => p.who !== 'proctor' || !p.fields ? p : { ...p, fields: p.fields.flatMap((x): AffField[] => {
    if (x.block && /^Proctor E-Signature:?$/.test(x.block.h4 ?? '')) return []
    if (x.id === 'p_name') return lineSig ? [P_NAME_ROW] : [P_NAME_ROW, P_SIGNATURE]
    if (x.id === 'p_sig') return [P_SIGNATURE]
    if (x.id === 'p_addr') return P_ADDRESS
    return [x]
  }) })
}

/* And "The date on this affidavit is the course completion date." is set in
   smaller print wherever it appears (2026-11-09, Afsana): a side note, not a
   statement the student is signing. */
export const COMPLETION_DATE_NOTE = 'The date on this affidavit is the course completion date.'
const fine = (b: AffBlock): AffBlock => (b.p === COMPLETION_DATE_NOTE ? { ...b, fine: true } : b)
for (const [key, form] of Object.entries(FORMS) as [string, AffForm][]) {
  if (!STATE_SPECIFIC_FORMS.includes(key)) form.who = 'student'
  form.pages = form.pages.map((p) => ({ ...p, blocks: p.blocks?.filter((b) => !eSig(b)).map(fine), fields: unsign(p.fields) }))
  form.fields = unsign(form.fields) ?? []
}
