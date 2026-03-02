"use strict";
/**
 * Seed SellerFi project and bug fix tasks
 * Run: npx convex run seedSellerFi:run
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
var server_1 = require("./_generated/server");
exports.run = (0, server_1.mutation)({
    args: {},
    handler: function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
        var existingProject, projectId, tasks, insertedTasks, _loop_1, _i, tasks_1, task, existingSofie, existingDev;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.db
                        .query("projects")
                        .withIndex("by_slug", function (q) { return q.eq("slug", "sellerfi"); })
                        .first()];
                case 1:
                    existingProject = _a.sent();
                    if (!existingProject) return [3 /*break*/, 2];
                    console.log("SellerFi project already exists:", existingProject._id);
                    projectId = existingProject._id;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, ctx.db.insert("projects", {
                        name: "SellerFi",
                        slug: "sellerfi",
                        description: "AI-first marketplace for seller financing",
                        metadata: {
                            repo: "https://github.com/jaydubya818/SellerFi",
                            localPath: "~/Projects/SellerFi",
                            runningServer: "~/SellerFin/seller-financing-platform",
                            vercelUrl: "https://sellerfi.vercel.app",
                            testAccounts: {
                                seller: { email: "ricconners@gmail.com", password: "password123" },
                                buyer: { email: "peteconman@gmail.com", password: "password123" },
                            },
                        },
                    })];
                case 3:
                    projectId = _a.sent();
                    console.log("Created SellerFi project:", projectId);
                    _a.label = 4;
                case 4:
                    tasks = [
                        {
                            title: "Verify Profile Picture Upload",
                            description: "Test profile picture upload for both Seller and Buyer accounts.\n\n**Steps:**\n1. Login as seller (ricconners@gmail.com)\n2. Go to Settings/Profile\n3. Click upload avatar\n4. Select an image\n5. Verify it uploads and displays\n6. Repeat for buyer (peteconman@gmail.com)\n\n**Expected:** Avatar uploads successfully and displays in header/profile\n\n**Files to check if broken:**\n- app/api/user/avatar/route.ts\n- components/profile-avatar-selector.tsx",
                            type: "ENGINEERING",
                            priority: 1,
                        },
                        {
                            title: "Verify Listing Creation Wizard",
                            description: "Test the full listing creation flow end-to-end.\n\n**Steps:**\n1. Login as seller (ricconners@gmail.com)\n2. Click \"Create Listing\" or \"Sell Your Business\"\n3. Complete all wizard steps:\n   - Business info (name, industry, location)\n   - Financial details\n   - Photo upload\n   - Document upload\n4. Submit listing\n\n**Expected:** Listing created and visible in dashboard\n\n**Files to check if broken:**\n- app/(main)/listings/new/comprehensive-listing-wizard.tsx\n- app/api/listings/route.ts",
                            type: "ENGINEERING",
                            priority: 1,
                        },
                        {
                            title: "Verify Document Upload in Listing Wizard",
                            description: "Test document upload functionality in listing creation.\n\n**Steps:**\n1. Login as seller\n2. Start new listing wizard\n3. Navigate to documents step\n4. Upload a PDF document\n5. Verify upload succeeds\n\n**Expected:** Document uploads and attaches to listing\n\n**Files to check if broken:**\n- app/api/listings/documents/upload/route.ts\n- Document upload component in wizard",
                            type: "ENGINEERING",
                            priority: 1,
                        },
                        {
                            title: "Verify Buyer Profile Completion",
                            description: "Test buyer profile completion flow (was showing P2023 database error).\n\n**Steps:**\n1. Login as buyer (peteconman@gmail.com)\n2. Go to complete profile\n3. Fill all required fields\n4. Submit\n\n**Expected:** Profile saves successfully, no P2023 error\n\n**Files to check if broken:**\n- app/(main)/buyers/elite/page.tsx\n- Profile update API",
                            type: "ENGINEERING",
                            priority: 1,
                        },
                        {
                            title: "Verify Mobile Nav Role-Awareness",
                            description: "Test that mobile navigation shows correct links based on user role.\n\n**Steps:**\n1. Open site on mobile viewport (or responsive mode)\n2. Login as seller \u2192 should see Dashboard link\n3. Logout, login as buyer \u2192 should see Profile link\n\n**Expected:** Nav adapts to user role\n\n**Files to check if broken:**\n- components/nav/mobile-nav.tsx\n- Auth context",
                            type: "ENGINEERING",
                            priority: 2,
                        },
                        {
                            title: "Verify Password Change Dialog",
                            description: "Test the password change functionality in settings.\n\n**Steps:**\n1. Login as any user\n2. Go to Settings\n3. Click \"Change Password\"\n4. Enter current and new password\n5. Submit\n\n**Expected:** Password changes successfully\n\n**Files to check if broken:**\n- components/settings/password-dialog.tsx\n- app/api/user/password/route.ts",
                            type: "ENGINEERING",
                            priority: 2,
                        },
                        {
                            title: "Verify Checkout Auth Detection",
                            description: "Test that pricing/upgrade flows detect logged-in users.\n\n**Steps:**\n1. Login as seller\n2. Go to Pricing page\n3. Click upgrade/subscribe\n4. Should NOT ask to create account again\n\n**Expected:** Logged-in user goes directly to checkout\n\n**Files to check if broken:**\n- components/upgrade-button.tsx\n- Pricing page checkout flow",
                            type: "ENGINEERING",
                            priority: 2,
                        },
                        {
                            title: "Verify 3-Month Pricing Discount",
                            description: "Confirm 3-month pricing shows 5% discount (not 15% premium).\n\n**Steps:**\n1. Go to Pricing page (logged out or logged in)\n2. Toggle to 3-month pricing\n3. Verify discount is shown (e.g., \"Save 5%\")\n4. Verify actual price is lower than monthly * 3\n\n**Expected:** 3-month = monthly * 3 * 0.95\n\n**Files to check if broken:**\n- lib/stripe-products-client.ts\n- Pricing display components",
                            type: "ENGINEERING",
                            priority: 1,
                        },
                        {
                            title: "Verify Industry Filter",
                            description: "Test industry filter on listings page.\n\n**Steps:**\n1. Go to /listings\n2. Select an industry from dropdown (e.g., \"Technology\")\n3. Apply filter\n\n**Expected:** Only listings with matching industry shown\n\n**Files to check if broken:**\n- app/api/listings/route.ts (industry filter logic)\n- Listings page filter component",
                            type: "ENGINEERING",
                            priority: 2,
                        },
                        {
                            title: "Git Push & Deploy to Vercel",
                            description: "Push all committed fixes to GitHub and trigger Vercel deployment.\n\n**Steps:**\n1. cd ~/Projects/SellerFi\n2. git status (verify clean)\n3. git push origin main\n4. Monitor Vercel deployment\n5. Verify production site works\n\n**Expected:** Production deployment successful\n\n**Vercel URL:** https://sellerfi.vercel.app",
                            type: "OPS",
                            priority: 1,
                        },
                    ];
                    insertedTasks = [];
                    _loop_1 = function (task) {
                        var existing, taskId;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, ctx.db
                                        .query("tasks")
                                        .withIndex("by_project", function (q) { return q.eq("projectId", projectId); })
                                        .filter(function (q) { return q.eq(q.field("title"), task.title); })
                                        .first()];
                                case 1:
                                    existing = _b.sent();
                                    if (existing) {
                                        console.log("Task already exists:", task.title);
                                        insertedTasks.push(existing._id);
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, ctx.db.insert("tasks", {
                                            projectId: projectId,
                                            title: task.title,
                                            description: task.description,
                                            type: task.type,
                                            status: "INBOX",
                                            priority: task.priority,
                                            assigneeIds: [],
                                            createdBy: "SYSTEM",
                                            actualCost: 0,
                                            reviewCycles: 0,
                                        })];
                                case 2:
                                    taskId = _b.sent();
                                    console.log("Created task:", task.title, taskId);
                                    insertedTasks.push(taskId);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, tasks_1 = tasks;
                    _a.label = 5;
                case 5:
                    if (!(_i < tasks_1.length)) return [3 /*break*/, 8];
                    task = tasks_1[_i];
                    return [5 /*yield**/, _loop_1(task)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_project", function (q) { return q.eq("projectId", projectId); })
                        .filter(function (q) { return q.eq(q.field("name"), "Sofie"); })
                        .first()];
                case 9:
                    existingSofie = _a.sent();
                    if (!!existingSofie) return [3 /*break*/, 11];
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            projectId: projectId,
                            name: "Sofie",
                            role: "LEAD",
                            status: "ACTIVE",
                            emoji: "👩‍💼",
                            allowedTaskTypes: ["ENGINEERING", "OPS", "CONTENT", "DOCS"],
                            budgetDaily: 50.0,
                            budgetPerRun: 5.0,
                            spendToday: 0,
                            workspacePath: "/agents/sofie",
                            canSpawn: true,
                            maxSubAgents: 3,
                            errorStreak: 0,
                            metadata: {
                                isCAO: true,
                                description: "Chief Agent Officer - oversees all SellerFi agent work",
                            },
                        })];
                case 10:
                    _a.sent();
                    console.log("Created Sofie (CAO) for SellerFi");
                    _a.label = 11;
                case 11: return [4 /*yield*/, ctx.db
                        .query("agents")
                        .withIndex("by_project", function (q) { return q.eq("projectId", projectId); })
                        .filter(function (q) { return q.eq(q.field("name"), "Dev"); })
                        .first()];
                case 12:
                    existingDev = _a.sent();
                    if (!!existingDev) return [3 /*break*/, 14];
                    return [4 /*yield*/, ctx.db.insert("agents", {
                            projectId: projectId,
                            name: "Dev",
                            role: "SPECIALIST",
                            status: "ACTIVE",
                            emoji: "👨‍💻",
                            allowedTaskTypes: ["ENGINEERING", "OPS"],
                            budgetDaily: 20.0,
                            budgetPerRun: 2.0,
                            spendToday: 0,
                            workspacePath: "/agents/dev",
                            canSpawn: false,
                            maxSubAgents: 0,
                            errorStreak: 0,
                            metadata: {
                                description: "Development agent - handles code fixes, testing, deployments",
                            },
                        })];
                case 13:
                    _a.sent();
                    console.log("Created Dev agent for SellerFi");
                    _a.label = 14;
                case 14: return [2 /*return*/, {
                        projectId: projectId,
                        tasksCreated: insertedTasks.length,
                        taskIds: insertedTasks,
                    }];
            }
        });
    }); },
});
