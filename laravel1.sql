-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 27, 2026 at 03:56 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `laravel1`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `action` varchar(255) NOT NULL,
  `actor_role` varchar(255) DEFAULT NULL,
  `actor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `action`, `actor_role`, `actor_id`, `meta`, `created_at`, `updated_at`) VALUES
(1, 'login', 'student', 7, NULL, '2026-03-26 18:54:13', '2026-03-26 18:54:13');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `course_code` varchar(20) NOT NULL,
  `course_name` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `course_code`, `course_name`, `department`, `created_at`, `updated_at`) VALUES
(1, 'BSCS', 'Bachelor of Science in Computer Science', 'Computer Studies', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(2, 'BSIT', 'Bachelor of Science in Information Technology', 'Computer Studies', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(3, 'BSIS', 'Bachelor of Science in Information Systems', 'Computer Studies', '2026-03-26 18:53:49', '2026-03-26 18:53:49');

-- --------------------------------------------------------

--
-- Table structure for table `curriculum`
--

CREATE TABLE `curriculum` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `course_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `year_level` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `curriculum`
--

INSERT INTO `curriculum` (`id`, `course_id`, `subject_id`, `year_level`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(2, 1, 2, 1, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(3, 1, 3, 1, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(4, 1, 11, 1, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(5, 1, 12, 1, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(6, 1, 4, 2, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(7, 1, 5, 2, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(8, 1, 6, 2, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(9, 1, 7, 3, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(10, 1, 8, 3, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(11, 1, 9, 3, '2026-03-26 18:53:49', '2026-03-26 18:53:49');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `category` enum('sports','academic','cultural') NOT NULL,
  `required_skill` varchar(255) DEFAULT NULL,
  `required_gpa` decimal(3,2) DEFAULT NULL,
  `event_date` date NOT NULL,
  `location` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `event_name`, `category`, `required_skill`, `required_gpa`, `event_date`, `location`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Intramurals Basketball Tournament', 'sports', 'Basketball', 2.00, '2026-04-11', 'University Gymnasium', 'Annual basketball tournament for all departments', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(2, 'Programming Hackathon 2026', 'academic', 'Programming', 2.50, '2026-04-26', 'Computer Laboratory', '24-hour coding competition', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(3, 'Leadership Summit', 'cultural', 'Leadership', 2.00, '2026-05-11', 'Conference Hall', 'Student leadership development program', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(4, 'Web Design Competition', 'academic', 'Web Development', 2.50, '2026-05-26', 'IT Building', 'Showcase your web design skills', '2026-03-26 18:53:49', '2026-03-26 18:53:49');

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faculty`
--

INSERT INTO `faculty` (`id`, `first_name`, `last_name`, `email`, `department`, `specialization`, `created_at`, `updated_at`) VALUES
(1, 'Maria', 'Santos', 'maria.santos@ccs.edu', 'Computer Science', 'Algorithms', '2026-03-26 18:53:50', '2026-03-26 18:53:50'),
(2, 'Juan', 'Dela Cruz', 'juan.delacruz@ccs.edu', 'Computer Science', 'Database Systems', '2026-03-26 18:53:50', '2026-03-26 18:53:50'),
(3, 'Ana', 'Reyes', 'ana.reyes@ccs.edu', 'Computer Science', 'Web Development', '2026-03-26 18:53:50', '2026-03-26 18:53:50'),
(4, 'Pedro', 'Garcia', 'pedro.garcia@ccs.edu', 'Computer Science', 'Software Engineering', '2026-03-26 18:53:50', '2026-03-26 18:53:50'),
(5, 'Rosa', 'Cruz', 'rosa.cruz@ccs.edu', 'Mathematics', 'Calculus', '2026-03-26 18:53:51', '2026-03-26 18:53:51');

-- --------------------------------------------------------

--
-- Table structure for table `faculty_assignments`
--

CREATE TABLE `faculty_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `faculty_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `section_id` bigint(20) UNSIGNED NOT NULL,
  `room` varchar(255) DEFAULT NULL,
  `semester` enum('first','second','summer') NOT NULL,
  `schedule_day` varchar(255) DEFAULT NULL,
  `start_time` varchar(255) DEFAULT NULL,
  `end_time` varchar(255) DEFAULT NULL,
  `school_year` varchar(9) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faculty_assignments`
--

INSERT INTO `faculty_assignments` (`id`, `faculty_id`, `subject_id`, `section_id`, `room`, `semester`, `schedule_day`, `start_time`, `end_time`, `school_year`, `created_at`, `updated_at`) VALUES
(1, 1, 7, 3, 'Room 301', 'first', 'Monday', '08:00', '10:00', '2025-2026', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(2, 3, 8, 3, 'Lab 1', 'first', 'Tuesday', '10:00', '12:00', '2025-2026', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(3, 4, 9, 3, 'Room 302', 'first', 'Wednesday', '14:00', '16:00', '2025-2026', '2026-03-26 18:53:51', '2026-03-26 18:53:51');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_03_17_011519_create_personal_access_tokens_table', 1),
(5, '2026_03_17_012340_add_role_to_users_table', 1),
(6, '2026_03_17_135346_create_audit_logs_table', 1),
(7, '2026_03_18_000001_create_courses_table', 1),
(8, '2026_03_18_000002_create_sections_table', 1),
(9, '2026_03_18_000003_create_faculty_table', 1),
(10, '2026_03_18_000004_create_students_table', 1),
(11, '2026_03_18_000005_create_subjects_table', 1),
(12, '2026_03_18_000006_create_curriculum_table', 1),
(13, '2026_03_18_000007_create_skill_master_table', 1),
(14, '2026_03_18_000008_create_student_skills_table', 1),
(15, '2026_03_18_000009_create_student_affiliations_table', 1),
(16, '2026_03_18_000010_create_student_violations_table', 1),
(17, '2026_03_18_000011_create_student_medical_history_table', 1),
(18, '2026_03_18_000012_create_events_table', 1),
(19, '2026_03_18_000013_create_student_non_academic_history_table', 1),
(20, '2026_03_18_000014_create_student_academic_history_table', 1),
(21, '2026_03_18_000015_create_faculty_assignments_table', 1),
(22, '2026_03_20_000016_add_enrollment_status_to_students_table', 1),
(23, '2026_03_20_000017_add_schedule_fields_to_faculty_assignments', 1),
(24, '2026_03_20_000017_add_schedule_fields_to_faculty_assignments_table', 1),
(25, '2026_03_20_000018_add_user_identifiers', 1),
(26, '2026_03_22_000001_add_avatar_path_to_users_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 7, 'web', '286acfcc6bbcacc2caa94014a12f54d0c2c72770c42686cb8248dca418d2d2df', '[\"*\"]', '2026-03-26 18:56:34', NULL, '2026-03-26 18:54:13', '2026-03-26 18:56:34');

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `section_name` varchar(255) NOT NULL,
  `course_id` bigint(20) UNSIGNED NOT NULL,
  `year_level` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `section_name`, `course_id`, `year_level`, `created_at`, `updated_at`) VALUES
(1, 'CS-1A', 1, 1, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(2, 'CS-2A', 1, 2, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(3, 'CS-3A', 1, 3, '2026-03-26 18:53:49', '2026-03-26 18:53:49');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `skill_master`
--

CREATE TABLE `skill_master` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `skill_name` varchar(255) NOT NULL,
  `skill_category` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `skill_master`
--

INSERT INTO `skill_master` (`id`, `skill_name`, `skill_category`, `created_at`, `updated_at`) VALUES
(1, 'Programming', 'Technical', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(2, 'Web Development', 'Technical', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(3, 'Database Design', 'Technical', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(4, 'Basketball', 'Sports', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(5, 'Volleyball', 'Sports', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(6, 'Leadership', 'Leadership', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(7, 'Public Speaking', 'Leadership', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(8, 'Graphic Design', 'Arts', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(9, 'Video Editing', 'Arts', '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(10, 'Project Management', 'Leadership', '2026-03-26 18:53:49', '2026-03-26 18:53:49');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_number` varchar(20) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `birthdate` date NOT NULL,
  `email` varchar(255) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `guardian_name` varchar(255) NOT NULL,
  `guardian_contact` varchar(20) NOT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `course_id` bigint(20) UNSIGNED NOT NULL,
  `section_id` bigint(20) UNSIGNED NOT NULL,
  `year_level` int(11) NOT NULL,
  `overall_gpa` decimal(3,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `enrollment_status` varchar(255) NOT NULL DEFAULT 'Enrolled'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_number`, `first_name`, `middle_name`, `last_name`, `gender`, `birthdate`, `email`, `contact_number`, `guardian_name`, `guardian_contact`, `height`, `weight`, `bmi`, `course_id`, `section_id`, `year_level`, `overall_gpa`, `created_at`, `updated_at`, `enrollment_status`) VALUES
(1, '2024-00001', 'Jane', 'Marie', 'Student', 'female', '2005-05-15', 'student@ccs.edu', '09171234567', 'John Student', '09187654321', 165.00, 55.00, 20.20, 1, 3, 3, 1.75, '2026-03-26 18:53:51', '2026-03-26 18:53:51', 'Enrolled');

-- --------------------------------------------------------

--
-- Table structure for table `student_academic_history`
--

CREATE TABLE `student_academic_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `subject_id` bigint(20) UNSIGNED NOT NULL,
  `grade` decimal(5,2) NOT NULL,
  `semester` enum('first','second','summer') NOT NULL,
  `school_year` varchar(9) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_academic_history`
--

INSERT INTO `student_academic_history` (`id`, `student_id`, `subject_id`, `grade`, `semester`, `school_year`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1.50, 'first', '2024-2025', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(2, 1, 2, 1.75, 'first', '2024-2025', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(3, 1, 3, 2.00, 'first', '2024-2025', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(4, 1, 11, 1.75, 'first', '2024-2025', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(5, 1, 12, 1.50, 'second', '2024-2025', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(6, 1, 4, 1.75, 'first', '2025-2026', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(7, 1, 5, 1.50, 'first', '2025-2026', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(8, 1, 6, 2.00, 'second', '2025-2026', '2026-03-26 18:53:51', '2026-03-26 18:53:51');

-- --------------------------------------------------------

--
-- Table structure for table `student_affiliations`
--

CREATE TABLE `student_affiliations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `organization_name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `status` enum('active','inactive','graduated') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_affiliations`
--

INSERT INTO `student_affiliations` (`id`, `student_id`, `organization_name`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Computer Science Society', 'President', 'active', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(2, 1, 'Google Developer Student Club', 'Core Team Member', 'active', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(3, 1, 'ACM Student Chapter', 'Member', 'active', '2026-03-26 18:53:51', '2026-03-26 18:53:51');

-- --------------------------------------------------------

--
-- Table structure for table `student_medical_history`
--

CREATE TABLE `student_medical_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `medical_condition` varchar(255) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `medications` text DEFAULT NULL,
  `last_checkup_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_medical_history`
--

INSERT INTO `student_medical_history` (`id`, `student_id`, `medical_condition`, `allergies`, `medications`, `last_checkup_date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, 'None', 'Peanuts', 'None', '2025-12-27', 'Healthy, no major concerns', '2026-03-26 18:53:51', '2026-03-26 18:53:51');

-- --------------------------------------------------------

--
-- Table structure for table `student_non_academic_history`
--

CREATE TABLE `student_non_academic_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `event_id` bigint(20) UNSIGNED NOT NULL,
  `role` varchar(255) NOT NULL,
  `result` enum('participated','winner','finalist','participant') NOT NULL,
  `achievements` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_non_academic_history`
--

INSERT INTO `student_non_academic_history` (`id`, `student_id`, `event_id`, `role`, `result`, `achievements`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'Participant', 'winner', 'First Place - Best Overall Project', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(2, 1, 3, 'Speaker', 'participated', 'Delivered keynote on student leadership', '2026-03-26 18:53:51', '2026-03-26 18:53:51');

-- --------------------------------------------------------

--
-- Table structure for table `student_skills`
--

CREATE TABLE `student_skills` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `skill_id` bigint(20) UNSIGNED NOT NULL,
  `skill_level` enum('beginner','intermediate','advanced','expert') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_skills`
--

INSERT INTO `student_skills` (`id`, `student_id`, `skill_id`, `skill_level`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'advanced', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(2, 1, 2, 'intermediate', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(3, 1, 3, 'intermediate', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(4, 1, 6, 'advanced', '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(5, 1, 7, 'intermediate', '2026-03-26 18:53:51', '2026-03-26 18:53:51');

-- --------------------------------------------------------

--
-- Table structure for table `student_violations`
--

CREATE TABLE `student_violations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `student_id` bigint(20) UNSIGNED NOT NULL,
  `violation_type` varchar(255) NOT NULL,
  `severity_level` enum('minor','major','critical') NOT NULL,
  `violation_date` date NOT NULL,
  `clearance_status` enum('pending','cleared','revoked') NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `units` decimal(3,1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `subject_code`, `subject_name`, `units`, `created_at`, `updated_at`) VALUES
(1, 'CS101', 'Introduction to Computer Science', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(2, 'CS102', 'Programming Fundamentals', 4.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(3, 'CS103', 'Discrete Mathematics', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(4, 'CS201', 'Data Structures and Algorithms', 4.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(5, 'CS202', 'Object-Oriented Programming', 4.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(6, 'CS203', 'Database Management Systems', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(7, 'CS301', 'Software Engineering', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(8, 'CS302', 'Web Development', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(9, 'CS303', 'Computer Networks', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(10, 'IT101', 'Information Technology Fundamentals', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(11, 'MATH101', 'Calculus I', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(12, 'ENG101', 'English Communication', 3.0, '2026-03-26 18:53:49', '2026-03-26 18:53:49');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `employee_number` varchar(7) DEFAULT NULL,
  `student_number` varchar(7) DEFAULT NULL,
  `role` enum('dean','faculty','student') NOT NULL DEFAULT 'student',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `avatar_path` varchar(255) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `employee_number`, `student_number`, `role`, `email_verified_at`, `password`, `avatar_path`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Dean Account', 'mirandakianandrei25@gmail.com', NULL, NULL, 'dean', NULL, '$2y$12$A/hvevesZKDjb1QRm1FS8ujZ5vKda8kjTG7YuFN6Kz7bqnYS.z3qm', NULL, NULL, '2026-03-26 18:53:49', '2026-03-26 18:53:49'),
(2, 'Maria Santos', 'maria.santos@ccs.edu', NULL, NULL, 'faculty', NULL, '$2y$12$KgO3ZuH7lHQV2oEpkBZJqePn97JH8mGQQ7UIYbZdJI.Yk138cDTti', NULL, NULL, '2026-03-26 18:53:50', '2026-03-26 18:53:50'),
(3, 'Juan Dela Cruz', 'juan.delacruz@ccs.edu', NULL, NULL, 'faculty', NULL, '$2y$12$RSU4xw.zMgJ8yJckoX8U0Ok3GxCQoZ.B9ZpSxGdxmkLj8tDcKQbyC', NULL, NULL, '2026-03-26 18:53:50', '2026-03-26 18:53:50'),
(4, 'Ana Reyes', 'ana.reyes@ccs.edu', NULL, NULL, 'faculty', NULL, '$2y$12$zJmxi6PNPAyswvTX85H0XeMih0RzRGTDZs.lMOxef76K2Uf5AQXY.', NULL, NULL, '2026-03-26 18:53:50', '2026-03-26 18:53:50'),
(5, 'Pedro Garcia', 'pedro.garcia@ccs.edu', NULL, NULL, 'faculty', NULL, '$2y$12$t2Q89RDO5o3xBg5YemjtVOkYZKIhA2BNibP6hdIoIcDyMPz9X5T3e', NULL, NULL, '2026-03-26 18:53:50', '2026-03-26 18:53:50'),
(6, 'Rosa Cruz', 'rosa.cruz@ccs.edu', NULL, NULL, 'faculty', NULL, '$2y$12$o.yMK0hGPrQ5CaTw2H4Oyeh2MqRI7jL8gAnwXKg2ImUgIasiXRC4W', NULL, NULL, '2026-03-26 18:53:51', '2026-03-26 18:53:51'),
(7, 'Jane Student', 'student@ccs.edu', NULL, NULL, 'student', NULL, '$2y$12$qadvcjUIt3.Vayu9nwFkxefC8KxAZ.BHHr2v6sl9nTl/w.4iqXDAa', NULL, NULL, '2026-03-26 18:53:51', '2026-03-26 18:53:51');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `courses_course_code_unique` (`course_code`);

--
-- Indexes for table `curriculum`
--
ALTER TABLE `curriculum`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `curriculum_course_id_subject_id_year_level_unique` (`course_id`,`subject_id`,`year_level`),
  ADD KEY `curriculum_subject_id_foreign` (`subject_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `faculty`
--
ALTER TABLE `faculty`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `faculty_email_unique` (`email`);

--
-- Indexes for table `faculty_assignments`
--
ALTER TABLE `faculty_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `fa_fac_sub_sec_sem_sy_unique` (`faculty_id`,`subject_id`,`section_id`,`semester`,`school_year`),
  ADD KEY `faculty_assignments_subject_id_foreign` (`subject_id`),
  ADD KEY `faculty_assignments_section_id_foreign` (`section_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sections_course_id_year_level_section_name_unique` (`course_id`,`year_level`,`section_name`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `skill_master`
--
ALTER TABLE `skill_master`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `skill_master_skill_name_skill_category_unique` (`skill_name`,`skill_category`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_student_number_unique` (`student_number`),
  ADD UNIQUE KEY `students_email_unique` (`email`),
  ADD KEY `students_course_id_foreign` (`course_id`),
  ADD KEY `students_section_id_foreign` (`section_id`),
  ADD KEY `students_enrollment_status_index` (`enrollment_status`);

--
-- Indexes for table `student_academic_history`
--
ALTER TABLE `student_academic_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sah_stu_subj_sem_sy_unique` (`student_id`,`subject_id`,`semester`,`school_year`),
  ADD KEY `student_academic_history_subject_id_foreign` (`subject_id`);

--
-- Indexes for table `student_affiliations`
--
ALTER TABLE `student_affiliations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_affiliations_student_id_foreign` (`student_id`);

--
-- Indexes for table `student_medical_history`
--
ALTER TABLE `student_medical_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_medical_history_student_id_foreign` (`student_id`);

--
-- Indexes for table `student_non_academic_history`
--
ALTER TABLE `student_non_academic_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_non_academic_history_student_id_foreign` (`student_id`),
  ADD KEY `student_non_academic_history_event_id_foreign` (`event_id`);

--
-- Indexes for table `student_skills`
--
ALTER TABLE `student_skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_skills_student_id_skill_id_unique` (`student_id`,`skill_id`),
  ADD KEY `student_skills_skill_id_foreign` (`skill_id`);

--
-- Indexes for table `student_violations`
--
ALTER TABLE `student_violations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_violations_student_id_foreign` (`student_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subjects_subject_code_unique` (`subject_code`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_employee_number_unique` (`employee_number`),
  ADD UNIQUE KEY `users_student_number_unique` (`student_number`),
  ADD KEY `users_role_index` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `curriculum`
--
ALTER TABLE `curriculum`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `faculty`
--
ALTER TABLE `faculty`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `faculty_assignments`
--
ALTER TABLE `faculty_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `skill_master`
--
ALTER TABLE `skill_master`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `student_academic_history`
--
ALTER TABLE `student_academic_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `student_affiliations`
--
ALTER TABLE `student_affiliations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_medical_history`
--
ALTER TABLE `student_medical_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `student_non_academic_history`
--
ALTER TABLE `student_non_academic_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `student_skills`
--
ALTER TABLE `student_skills`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `student_violations`
--
ALTER TABLE `student_violations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `curriculum`
--
ALTER TABLE `curriculum`
  ADD CONSTRAINT `curriculum_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  ADD CONSTRAINT `curriculum_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`);

--
-- Constraints for table `faculty_assignments`
--
ALTER TABLE `faculty_assignments`
  ADD CONSTRAINT `faculty_assignments_faculty_id_foreign` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`id`),
  ADD CONSTRAINT `faculty_assignments_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`),
  ADD CONSTRAINT `faculty_assignments_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`);

--
-- Constraints for table `sections`
--
ALTER TABLE `sections`
  ADD CONSTRAINT `sections_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`);

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  ADD CONSTRAINT `students_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`);

--
-- Constraints for table `student_academic_history`
--
ALTER TABLE `student_academic_history`
  ADD CONSTRAINT `student_academic_history_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `student_academic_history_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`);

--
-- Constraints for table `student_affiliations`
--
ALTER TABLE `student_affiliations`
  ADD CONSTRAINT `student_affiliations_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `student_medical_history`
--
ALTER TABLE `student_medical_history`
  ADD CONSTRAINT `student_medical_history_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `student_non_academic_history`
--
ALTER TABLE `student_non_academic_history`
  ADD CONSTRAINT `student_non_academic_history_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  ADD CONSTRAINT `student_non_academic_history_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `student_skills`
--
ALTER TABLE `student_skills`
  ADD CONSTRAINT `student_skills_skill_id_foreign` FOREIGN KEY (`skill_id`) REFERENCES `skill_master` (`id`),
  ADD CONSTRAINT `student_skills_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `student_violations`
--
ALTER TABLE `student_violations`
  ADD CONSTRAINT `student_violations_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
