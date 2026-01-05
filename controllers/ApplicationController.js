/**
 * Application Controller
 */

const Application = require("../models/Application");
const Job = require("../models/Job");

// ===============================
// APPLY TO JOB
// ===============================

exports.applyToJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { proposal, proposed_budget } = req.body;
    const taskerId = req.userId;

    // Validate required fields
    if (!proposal) {
      return res.status(400).json({
        success: false,
        message: "Proposal is required",
      });
    }

    // Validate user role (must be tasker)
    if (req.user.role !== 'tasker') {
      return res.status(403).json({
        success: false,
        message: "Only taskers can apply to jobs",
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if job is still open
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: "Cannot apply to a job that is not open",
      });
    }

    // Check if user already applied
    const existingApplication = await Application.findByJobAndTasker(jobId, taskerId);
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    // Check if user is the poster of the job
    if (job.poster_id === taskerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own job",
      });
    }

    // Create application
    const applicationData = {
      job_id: jobId,
      tasker_id: taskerId,
      proposal,
      proposed_budget: proposed_budget || null,
    };

    const applicationId = await Application.create(applicationData);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: {
        id: applicationId,
        ...applicationData,
        status: 'pending',
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error("applyToJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: error.message,
    });
  }
};

// ===============================
// GET APPLICATIONS FOR A JOB
// ===============================

exports.getApplicationsForJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const posterId = req.userId;

    // Validate user role (must be poster)
    if (req.user.role !== 'poster') {
      return res.status(403).json({
        success: false,
        message: "Only posters can view applications for their jobs",
      });
    }

    // Check if job exists and belongs to user
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.poster_id !== posterId) {
      return res.status(403).json({
        success: false,
        message: "You can only view applications for jobs you posted",
      });
    }

    const applications = await Application.findByJobId(jobId);

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("getApplicationsForJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  }
};

// ===============================
// ACCEPT APPLICATION
// ===============================

exports.acceptApplication = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const posterId = req.userId;

    // Validate user role (must be poster)
    if (req.user.role !== 'poster') {
      return res.status(403).json({
        success: false,
        message: "Only posters can accept applications",
      });
    }

    // Get application details
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Get job details
    const job = await Job.findById(application.job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the poster of the job
    if (job.poster_id !== posterId) {
      return res.status(403).json({
        success: false,
        message: "You can only accept applications for jobs you posted",
      });
    }

    // Check if job is still open
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: "Cannot accept application for a job that is not open",
      });
    }

    // Update application status to accepted
    await Application.updateStatus(applicationId, 'accepted');

    // Update job status to in_progress
    await Job.update(application.job_id, { status: 'in_progress' });

    res.json({
      success: true,
      message: "Application accepted successfully",
    });
  } catch (error) {
    console.error("acceptApplication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept application",
      error: error.message,
    });
  }
};

// ===============================
// REJECT APPLICATION
// ===============================

exports.rejectApplication = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const posterId = req.userId;

    // Validate user role (must be poster)
    if (req.user.role !== 'poster') {
      return res.status(403).json({
        success: false,
        message: "Only posters can reject applications",
      });
    }

    // Get application details
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Get job details
    const job = await Job.findById(application.job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if user is the poster of the job
    if (job.poster_id !== posterId) {
      return res.status(403).json({
        success: false,
        message: "You can only reject applications for jobs you posted",
      });
    }

    // Update application status to rejected
    await Application.updateStatus(applicationId, 'rejected');

    res.json({
      success: true,
      message: "Application rejected successfully",
    });
  } catch (error) {
    console.error("rejectApplication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject application",
      error: error.message,
    });
  }
};

// ===============================
// GET MY APPLICATIONS
// ===============================

exports.getMyApplications = async (req, res) => {
  try {
    const taskerId = req.userId;

    // Validate user role (must be tasker)
    if (req.user.role !== 'tasker') {
      return res.status(403).json({
        success: false,
        message: "Only taskers can view their applications",
      });
    }

    const applications = await Application.findByTaskerId(taskerId);

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("getMyApplications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your applications",
      error: error.message,
    });
  }
};

// ===============================
// GET APPLICATION BY ID
// ===============================

exports.getApplicationById = async (req, res) => {
  try {
    const { id: applicationId } = req.params;
    const userId = req.userId;

    // Get application details with job and user info
    const appData = await Application.findById(applicationId);
    if (!appData) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Get job details for authorization check
    const job = await Job.findById(appData.job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Authorization: user must be the poster of the job or the tasker
    if (job.poster_id !== userId && appData.tasker_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this application",
      });
    }

    // Transform flat response to nested structure for frontend
    const application = {
      id: appData.id,
      job_id: appData.job_id,
      tasker_id: appData.tasker_id,
      proposal: appData.proposal,
      proposed_budget: appData.proposed_budget,
      status: appData.status,
      created_at: appData.created_at,
      applied_at: appData.created_at,
      updated_at: appData.updated_at,
      user: {
        id: appData.user_id,
        name: appData.user_name,
        email: appData.user_email,
        experience: appData.user_experience,
      },
      job: {
        id: appData.job_id,
        title: appData.job_title,
        description: appData.job_description,
        budget: appData.job_budget,
      },
    };

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("getApplicationById error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message,
    });
  }
};