-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 23, 2026 at 10:25 AM
-- Server version: 10.11.16-MariaDB
-- PHP Version: 8.3.36

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rental_management_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `name`, `description`, `image_url`, `created_at`, `updated_at`) VALUES
(2, 'Construction & Tools', 'Power tools, heavy duty equipment, drills, and saws', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500', '2026-10-24 08:41:29', '2026-10-24 08:41:29'),
(4, 'Party & Event Gear', 'Fog machines, disco lights, popcorn makers, and event tents', 'https://image.made-in-china.com/229f0j00bTeRIUaCmqzE/260330-mp4.webp', '2026-10-24 08:41:29', '2026-10-30 17:25:52'),
(5, 'Vehicles & Scooters', 'Electric scooters, bicycles, hoverboards, and mopeds', 'http://radboards.in/cdn/shop/files/subbareddy_ShippingLabel_2.jpg?v=1787146611', '2026-10-24 08:41:29', '2026-10-30 17:25:52'),
(101, 'Scooters', 'Electric and kick scooters for urban commuting', 'https://png.pngtree.com/png-vector/20261024/ourlarge/pngtree-modern-electric-scooter-for-banner-design-isolated-on-white-background-png-image_20293423.webp', '2026-10-30 17:03:11', '2026-10-30 17:37:20'),
(102, 'Bikes', 'Bicycles, mountain bikes, and electric bikes', 'https://media.istockphoto.com/id/451010941/vector/red-mountain-bike.jpg?s=612x612&w=0&k=20&c=ikKv1Rx48nKYlxYoyRarlsY2Cb6Fqd1D_cQF02bm8Q0=', '2026-10-30 17:03:11', '2026-10-30 17:37:20'),
(103, 'Cars', 'Hatchbacks, sedans, SUVs, and vans for rent', 'https://static.vecteezy.com/system/resources/previews/080/295/736/non_2x/modern-yellow-hatchback-car-isolated-on-a-white-background-psd.png', '2026-10-30 17:03:11', '2026-10-30 17:37:20'),
(104, 'Cameras', 'DSLR, mirrorless, action cameras, and photography gear', 'https://img.magnific.com/premium-psd/professional-mirrorless-camera-with-lens-isolated-white-background_1260512-5645.jpg?semt=ais_hybrid&w=740&q=80', '2026-10-30 17:03:11', '2026-10-30 17:37:20'),
(105, 'Drones', 'Aerial photography and professional drones', 'https://img.magnific.com/premium-photo/professional-drone-camera-isolated-white-background-ultrarealistic-ar-169-v-7-job-id-fbffd63e9b36438b8da06f81719072c8_1021802-30023.jpg?semt=ais_hybrid&w=740&q=80', '2026-10-30 17:03:11', '2026-10-30 17:37:20'),
(106, 'Laptops', 'High-performance laptops, ultrabooks, and workstations', 'https://as2.ftcdn.net/v2/jpg/05/30/81/69/1000_F_530816986_KW8Xtsn2i5q9NTXQLGsLOHHbf06znP6n.jpg', '2026-10-30 17:03:11', '2026-10-30 17:37:20'),
(107, 'Televisions', 'Smart 4K TVs, OLED screens, and monitors', 'https://media.istockphoto.com/id/1395191574/photo/black-led-tv-television-screen-blank-isolated.jpg?s=612x612&w=0&k=20&c=ps14JZJh0ebkINcbQyHFsR1J5EC7ozkj_WO7Fh_9IOI=', '2026-10-30 17:03:11', '2026-11-22 16:45:14'),
(201, 'Audio & Sound System', 'Speakers, microphones, headphones, and professional DJ gear', 'https://audioarray.in/cdn/shop/files/01_28751fb5-cff3-45f5-a349-6b9ed11dedf2.jpg?v=1765003903&width=1920', '2026-10-30 17:24:20', '2026-10-30 17:25:52'),
(202, 'Camera & Photography', 'Mirrorless cameras, lenses, tripods, and lighting kits', 'https://shopatsc.com/cdn/shop/products/ZV-E10-01.jpg?v=1697630881', '2026-10-30 17:24:20', '2026-10-30 17:25:52');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `invoice_id` int(11) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rental_id` int(11) DEFAULT NULL,
  `billing_month` varchar(7) NOT NULL,
  `subtotal_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `late_fee_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('draft','issued','paid','overdue','cancelled','DRAFT','PENDING','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `base_rent` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `invoice_item_id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `late_fees`
--

CREATE TABLE `late_fees` (
  `late_fee_id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `overdue_hours` int(11) NOT NULL DEFAULT 0,
  `rate_per_hour` decimal(10,2) NOT NULL DEFAULT 0.00,
  `calculated_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('unpaid','paid','waived') NOT NULL DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `invoice_id` int(11) DEFAULT NULL,
  `overdue_days` int(11) NOT NULL DEFAULT 0,
  `applied_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `late_fee_configs`
--

CREATE TABLE `late_fee_configs` (
  `config_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL DEFAULT 'Default Config',
  `grace_period_days` int(11) NOT NULL DEFAULT 3,
  `late_fee_type` enum('fixed','percentage','per_day') NOT NULL DEFAULT 'fixed',
  `late_fee_value` decimal(10,2) NOT NULL DEFAULT 500.00,
  `max_late_fee` decimal(10,2) DEFAULT 2000.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `late_fee_configs`
--

INSERT INTO `late_fee_configs` (`config_id`, `name`, `grace_period_days`, `late_fee_type`, `late_fee_value`, `max_late_fee`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Standard Policy', 3, 'fixed', 500.00, 2000.00, 1, '2026-11-08 07:46:45', '2026-11-08 07:46:45');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('RENT_DUE','RENT_PAID','RENT_OVERDUE','LATE_FEE','SECURITY_DEPOSIT','PAYMENT_SUCCESS','PAYMENT_FAILED','INVOICE_GENERATED','MAINTENANCE','GENERAL','general','rental','invoice','payment','return','late_fee') NOT NULL DEFAULT 'GENERAL',
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reference_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `type`, `title`, `message`, `is_read`, `created_at`, `updated_at`, `reference_id`) VALUES
(1, 3, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261024-FF7F15 has been placed successfully and is pending approval.', 0, '2026-10-24 08:59:00', '2026-10-24 08:59:00', NULL),
(2, 3, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261024-94EFBE has been placed successfully and is pending approval.', 0, '2026-10-24 09:01:26', '2026-10-24 09:01:26', NULL),
(3, 3, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261024-94EFBE status has been updated to \"CANCELLED\".', 0, '2026-10-24 09:07:34', '2026-10-24 09:07:34', NULL),
(4, 3, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261024-90E6A5 has been placed successfully and is pending approval.', 0, '2026-10-24 09:08:03', '2026-10-24 09:08:03', NULL),
(5, 3, 'GENERAL', 'Cash on Delivery Selected', 'Cash on Delivery selected for Booking #RNT-20261024-90E6A5. Payable Amount: ₹15,000. Payment will be collected upon equipment delivery.', 0, '2026-10-24 09:17:58', '2026-10-24 09:17:58', '3'),
(6, 3, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261027-027ED9 has been placed successfully and is pending approval.', 0, '2026-10-27 08:26:38', '2026-10-27 08:26:38', NULL),
(7, 3, 'GENERAL', 'Cash on Delivery Selected', 'Cash on Delivery selected for Booking #RNT-20261027-027ED9. Payable Amount: ₹55,000. Payment will be collected upon equipment delivery.', 0, '2026-10-27 08:27:38', '2026-10-27 08:27:38', '4'),
(8, 3, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261027-027ED9 status has been updated to \"CANCELLED\".', 0, '2026-10-27 08:27:48', '2026-10-27 08:27:48', NULL),
(9, 3, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261024-90E6A5 status has been updated to \"CANCELLED\".', 0, '2026-10-27 08:27:50', '2026-10-27 08:27:50', NULL),
(10, 3, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261030-14B0C9 has been placed successfully and is pending approval.', 0, '2026-10-30 16:54:22', '2026-10-30 16:54:22', NULL),
(12, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261102-5B22AB has been placed successfully and is pending approval.', 0, '2026-11-02 09:22:07', '2026-11-02 09:22:07', NULL),
(13, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261102-C2802A has been placed successfully and is pending approval.', 0, '2026-11-02 09:26:08', '2026-11-02 09:26:08', NULL),
(14, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261102-0D7CA8 has been placed successfully and is pending approval.', 0, '2026-11-02 09:26:10', '2026-11-02 09:26:10', NULL),
(15, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261102-0D7CA8 status has been updated to \"CANCELLED\".', 0, '2026-11-02 09:27:50', '2026-11-02 09:27:50', NULL),
(16, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261102-C2802A status has been updated to \"CANCELLED\".', 0, '2026-11-02 09:27:52', '2026-11-02 09:27:52', NULL),
(17, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261102-5B22AB status has been updated to \"CANCELLED\".', 0, '2026-11-02 09:27:54', '2026-11-02 09:27:54', NULL),
(18, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261102-63DA47 has been placed successfully and is pending approval.', 0, '2026-11-02 10:26:51', '2026-11-02 10:26:51', NULL),
(19, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261102-63DA47 status has been updated to \"CANCELLED\".', 0, '2026-11-02 10:27:23', '2026-11-02 10:27:23', NULL),
(20, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261102-C05D2A has been placed successfully and is pending approval.', 0, '2026-11-02 10:27:32', '2026-11-02 10:27:32', NULL),
(21, 16, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261102-090AAF has been placed successfully and is pending approval.', 0, '2026-11-02 11:02:06', '2026-11-02 11:02:06', NULL),
(22, 16, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261102-BBE643 has been placed successfully and is pending approval.', 0, '2026-11-02 11:02:49', '2026-11-02 11:02:49', NULL),
(23, 16, 'GENERAL', 'Cash on Delivery Selected', 'Cash on Delivery selected for Booking #RNT-20261102-BBE643. Payable Amount: ₹420. Payment will be collected upon equipment delivery.', 0, '2026-11-02 11:02:53', '2026-11-02 11:02:53', '13'),
(24, 16, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261102-BBE643 status has been updated to \"CANCELLED\".', 0, '2026-11-02 11:07:53', '2026-11-02 11:07:53', NULL),
(25, 16, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261102-090AAF status has been updated to \"CANCELLED\".', 0, '2026-11-02 11:07:55', '2026-11-02 11:07:55', NULL),
(26, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261102-C05D2A status has been updated to \"CANCELLED\".', 0, '2026-11-04 17:52:56', '2026-11-04 17:52:56', NULL),
(27, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261104-4C27A4 has been placed successfully and is pending approval.', 0, '2026-11-04 17:53:05', '2026-11-04 17:53:05', NULL),
(28, 1, 'PAYMENT_SUCCESS', 'Payment Verified & Confirmed', 'Your Razorpay payment of ₹1,500 (Tx ID: pay_TwCBD4NgxaFQRO) has been verified and confirmed successfully.', 0, '2026-11-04 18:22:53', '2026-11-04 18:22:53', '26'),
(29, 1, 'RENT_PAID', 'Rent Payment Recorded', 'Rent payment of ₹1,500 has been successfully processed.', 0, '2026-11-04 18:22:53', '2026-11-04 18:22:53', '14'),
(30, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261104-4C27A4 status has been updated to \"CANCELLED\".', 0, '2026-11-04 18:23:21', '2026-11-04 18:23:21', NULL),
(31, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261104-E40A5C has been placed successfully and is pending approval.', 0, '2026-11-04 18:23:33', '2026-11-04 18:23:33', NULL),
(32, 1, 'PAYMENT_SUCCESS', 'Payment Verified & Confirmed', 'Your Razorpay payment of ₹130 (Tx ID: pay_TwCI3uzIVTC2lO) has been verified and confirmed successfully.', 0, '2026-11-04 18:29:16', '2026-11-04 18:29:16', '28'),
(33, 1, 'RENT_PAID', 'Rent Payment Recorded', 'Rent payment of ₹130 has been successfully processed.', 0, '2026-11-04 18:29:16', '2026-11-04 18:29:16', '15'),
(34, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261104-1D066D has been placed successfully and is pending approval.', 0, '2026-11-04 18:33:06', '2026-11-04 18:33:06', NULL),
(35, 1, 'PAYMENT_SUCCESS', 'Payment Verified & Confirmed', 'Your Razorpay payment of ₹300 (Tx ID: pay_TwCMpbfOtKqqOc) has been verified and confirmed successfully.', 0, '2026-11-04 18:33:45', '2026-11-04 18:33:45', '29'),
(36, 1, 'RENT_PAID', 'Rent Payment Recorded', 'Rent payment of ₹300 has been successfully processed.', 0, '2026-11-04 18:33:45', '2026-11-04 18:33:45', '16'),
(37, 16, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261108-AFC822 has been placed successfully and is pending approval.', 0, '2026-11-08 11:14:45', '2026-11-08 11:14:45', NULL),
(38, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261108-57AD0C has been placed successfully and is pending approval.', 0, '2026-11-08 11:20:46', '2026-11-08 11:20:46', NULL),
(39, 1, 'PAYMENT_SUCCESS', 'Payment Verified & Confirmed', 'Your Razorpay payment of ₹500.00 (Tx ID: pay_Txf99X2UimXECq) has been verified and confirmed successfully.', 0, '2026-11-08 11:22:03', '2026-11-08 11:22:03', '32'),
(40, 16, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261108-DB32CF has been placed successfully and is pending approval.', 0, '2026-11-08 11:22:41', '2026-11-08 11:22:41', NULL),
(41, 16, 'PAYMENT_SUCCESS', 'Payment Verified & Confirmed', 'Your Razorpay payment of ₹300.00 (Tx ID: pay_TxfAagvi8QZlQk) has been verified and confirmed successfully.', 0, '2026-11-08 11:23:18', '2026-11-08 11:23:18', '33'),
(42, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261118-F726E5 has been placed successfully and is pending approval.', 0, '2026-11-18 07:25:13', '2026-11-18 07:25:13', NULL),
(43, 1, 'PAYMENT_SUCCESS', 'Payment Verified & Confirmed', 'Your Razorpay payment of ₹40.00 (Tx ID: pay_U1YTVjVXrsL2H1) has been verified and confirmed successfully.', 0, '2026-11-18 07:26:10', '2026-11-18 07:26:10', '34'),
(44, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261118-F726E5 status has been updated to \"APPROVED\".', 0, '2026-11-18 07:26:52', '2026-11-18 07:26:52', NULL),
(45, 16, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261108-DB32CF status has been updated to \"APPROVED\".', 0, '2026-11-18 07:26:53', '2026-11-18 07:26:53', NULL),
(46, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261108-57AD0C status has been updated to \"APPROVED\".', 0, '2026-11-18 07:26:55', '2026-11-18 07:26:55', NULL),
(47, 16, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261108-AFC822 status has been updated to \"REJECTED\".', 0, '2026-11-18 07:26:57', '2026-11-18 07:26:57', NULL),
(48, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261104-1D066D status has been updated to \"APPROVED\".', 0, '2026-11-18 07:26:59', '2026-11-18 07:26:59', NULL),
(49, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261104-E40A5C status has been updated to \"APPROVED\".', 0, '2026-11-18 07:27:00', '2026-11-18 07:27:00', NULL),
(50, 1, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261122-727864 has been placed successfully and is pending approval.', 0, '2026-11-22 16:04:45', '2026-11-22 16:04:45', NULL),
(51, 1, 'PAYMENT_SUCCESS', 'Payment Verified & Confirmed', 'Your Razorpay payment of ₹40.00 (Tx ID: pay_U3HfGcXxZck7cL) has been verified and confirmed successfully.', 0, '2026-11-22 16:17:38', '2026-11-22 16:17:38', '35'),
(52, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261122-727864 status has been updated to \"APPROVED\".', 0, '2026-11-22 16:18:15', '2026-11-22 16:18:15', NULL),
(53, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261122-727864 status has been updated to \"ACTIVE\".', 0, '2026-11-22 16:18:17', '2026-11-22 16:18:17', NULL),
(54, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261118-F726E5 status has been updated to \"ACTIVE\".', 0, '2026-11-22 16:18:18', '2026-11-22 16:18:18', NULL),
(55, 16, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261108-DB32CF status has been updated to \"ACTIVE\".', 0, '2026-11-22 16:18:20', '2026-11-22 16:18:20', NULL),
(56, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261108-57AD0C status has been updated to \"ACTIVE\".', 0, '2026-11-22 16:18:20', '2026-11-22 16:18:20', NULL),
(57, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261104-1D066D status has been updated to \"ACTIVE\".', 0, '2026-11-22 16:18:21', '2026-11-22 16:18:21', NULL),
(58, 1, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261104-E40A5C status has been updated to \"ACTIVE\".', 0, '2026-11-22 16:18:22', '2026-11-22 16:18:22', NULL),
(60, 3, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261030-14B0C9 status has been updated to \"APPROVED\".', 0, '2026-11-22 16:18:24', '2026-11-22 16:18:24', NULL),
(62, 3, 'GENERAL', 'Booking Status Updated', 'Your rental booking RNT-20261030-14B0C9 status has been updated to \"ACTIVE\".', 0, '2026-11-22 16:18:26', '2026-11-22 16:18:26', NULL),
(63, 18, 'GENERAL', 'Booking Created', 'Your rental booking RNT-20261122-8BE92F has been placed successfully and is pending approval.', 0, '2026-11-22 17:08:49', '2026-11-22 17:08:49', NULL),
(64, 18, 'PAYMENT_SUCCESS', 'Payment Verified & Confirmed', 'Your Razorpay payment of ₹50.00 (Tx ID: pay_U3IYjnVVo8Fgwz) has been verified and confirmed successfully.', 0, '2026-11-22 17:10:06', '2026-11-22 17:10:06', '36');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `rental_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `transaction_id` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_type` enum('full','partial','security_deposit','late_fee','invoice','RENT','SECURITY_DEPOSIT','LATE_FEE','OTHER') NOT NULL,
  `payment_method` enum('mock_card','mock_upi','razorpay','cash','bank_transfer','cash_on_delivery') NOT NULL DEFAULT 'mock_card',
  `status` enum('pending','success','failed','refunded','PENDING','SUCCESS','FAILED','REFUNDED','PENDING_COLLECTION') NOT NULL DEFAULT 'pending',
  `payment_date` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `razorpay_order_id` varchar(100) DEFAULT NULL,
  `razorpay_payment_id` varchar(100) DEFAULT NULL,
  `razorpay_signature` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `rental_id`, `user_id`, `invoice_id`, `transaction_id`, `amount`, `payment_type`, `payment_method`, `status`, `payment_date`, `created_at`, `updated_at`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) VALUES
(1, 2, 3, NULL, 'TXN-COD-1792832555722-CC87', 15000.00, 'full', '', '', '2026-10-24 09:02:35', '2026-10-24 09:02:35', '2026-10-24 09:02:35', NULL, NULL, NULL),
(2, 3, 3, NULL, 'TXN-RZP-1792832933020-49DF', 15000.00, 'full', 'razorpay', 'pending', '2026-10-24 09:08:53', '2026-10-24 09:08:53', '2026-10-24 09:08:53', 'order_TrgsL0vGh4qUpH', NULL, NULL),
(3, 3, 3, NULL, 'TXN-RZP-1792832954291-61C6', 15000.00, 'full', 'razorpay', 'pending', '2026-10-24 09:09:14', '2026-10-24 09:09:14', '2026-10-24 09:09:14', 'order_TrgsiEFVYPYoqm', NULL, NULL),
(4, 3, 3, NULL, 'TXN-RZP-1792833029076-4B40', 15000.00, 'full', 'razorpay', 'pending', '2026-10-24 09:10:29', '2026-10-24 09:10:29', '2026-10-24 09:10:29', 'order_Trgu1rfdj4BypI', NULL, NULL),
(5, 3, 3, NULL, 'TXN-RZP-1792833123676-1317', 15000.00, 'full', 'razorpay', 'pending', '2026-10-24 09:12:03', '2026-10-24 09:12:03', '2026-10-24 09:12:03', 'order_Trgvh7aiICDv5M', NULL, NULL),
(6, 3, 3, NULL, 'TXN-RZP-1792833246497-9E6C', 15000.00, 'full', 'razorpay', 'pending', '2026-10-24 09:14:06', '2026-10-24 09:14:06', '2026-10-24 09:14:06', 'order_TrgxrChivZFtId', NULL, NULL),
(7, 3, 3, NULL, 'TXN-RZP-1792833251400-9355', 15000.00, 'full', 'razorpay', 'pending', '2026-10-24 09:14:11', '2026-10-24 09:14:11', '2026-10-24 09:14:11', 'order_TrgxwWPdmHDZAK', NULL, NULL),
(8, 3, 3, NULL, 'TXN-RZP-1792833302675-D45F', 15000.00, 'full', 'razorpay', 'pending', '2026-10-24 09:15:02', '2026-10-24 09:15:02', '2026-10-24 09:15:02', 'order_TrgyqWcBfRYuOR', NULL, NULL),
(9, 3, 3, NULL, 'TXN-COD-1792833326206-1339', 15000.00, 'full', '', '', '2026-10-24 09:15:26', '2026-10-24 09:15:26', '2026-10-24 09:15:26', NULL, NULL, NULL),
(10, 3, 3, NULL, 'TXN-COD-1792833333921-FFFB', 15000.00, 'full', '', '', '2026-10-24 09:15:33', '2026-10-24 09:15:33', '2026-10-24 09:15:33', NULL, NULL, NULL),
(11, 3, 3, NULL, 'TXN-COD-1792833338092-1080', 15000.00, 'full', '', '', '2026-10-24 09:15:38', '2026-10-24 09:15:38', '2026-10-24 09:15:38', NULL, NULL, NULL),
(12, 3, 3, NULL, 'TXN-COD-1792833478499-C08B', 15000.00, 'full', 'cash_on_delivery', 'PENDING_COLLECTION', '2026-10-24 09:17:58', '2026-10-24 09:17:58', '2026-10-24 09:17:58', NULL, NULL, NULL),
(13, 3, 3, NULL, 'TXN-RZP-1792833493613-BC69', 15000.00, 'full', 'razorpay', 'pending', '2026-10-24 09:18:13', '2026-10-24 09:18:13', '2026-10-24 09:18:13', 'order_Trh2Cv0YYToC62', NULL, NULL),
(14, 4, 3, NULL, 'TXN-RZP-1793089633748-D999', 55000.00, 'full', 'razorpay', 'pending', '2026-10-27 08:27:13', '2026-10-27 08:27:13', '2026-10-27 08:27:13', 'order_TsrleLsyc2E5U9', NULL, NULL),
(15, 4, 3, NULL, 'TXN-COD-1793089658343-60F0', 55000.00, 'full', 'cash_on_delivery', 'PENDING_COLLECTION', '2026-10-27 08:27:38', '2026-10-27 08:27:38', '2026-10-27 08:27:38', NULL, NULL, NULL),
(16, 5, 3, NULL, 'TXN-RZP-1793379265019-057B', 9500.00, 'full', 'razorpay', 'pending', '2026-10-30 16:54:25', '2026-10-30 16:54:25', '2026-10-30 16:54:25', 'order_TuC0i30ysImtU2', NULL, NULL),
(17, 6, NULL, NULL, 'TXN-RZP-1793610783517-BFE7', 2500.00, 'full', 'razorpay', 'pending', '2026-11-02 09:13:03', '2026-11-02 09:13:03', '2026-11-02 09:13:03', 'order_TvFkg1znNweqkt', NULL, NULL),
(18, 13, 16, NULL, 'TXN-COD-1793617373730-1650', 420.00, 'full', 'cash_on_delivery', 'PENDING_COLLECTION', '2026-11-02 11:02:53', '2026-11-02 11:02:53', '2026-11-02 11:02:53', NULL, NULL, NULL),
(19, 11, 1, NULL, 'TXN-RZP-1793814515734-675D', 1500.00, 'full', 'razorpay', 'pending', '2026-11-04 17:48:35', '2026-11-04 17:48:35', '2026-11-04 17:48:35', 'order_TwBbSvKhvgUnKy', NULL, NULL),
(20, 11, 1, NULL, 'TXN-RZP-1793814736799-0881', 1500.00, 'full', 'razorpay', 'pending', '2026-11-04 17:52:16', '2026-11-04 17:52:16', '2026-11-04 17:52:16', 'order_TwBfMEri2zS9Wq', NULL, NULL),
(21, 14, 1, NULL, 'TXN-RZP-1793814790166-056A', 1500.00, 'full', 'razorpay', 'pending', '2026-11-04 17:53:10', '2026-11-04 17:53:10', '2026-11-04 17:53:10', 'order_TwBgIVVr5v5Vfu', NULL, NULL),
(22, 14, 1, NULL, 'TXN-RZP-1793815505528-7F9C', 1500.00, 'full', 'razorpay', 'pending', '2026-11-04 18:05:05', '2026-11-04 18:05:05', '2026-11-04 18:05:05', 'order_TwBstLnhYFRRdn', NULL, NULL),
(23, 14, 1, NULL, 'TXN-RZP-1793815985851-E67C', 1500.00, 'full', 'razorpay', 'pending', '2026-11-04 18:13:05', '2026-11-04 18:13:05', '2026-11-04 18:13:05', 'order_TwC1LdoMoCqOIj', NULL, NULL),
(24, 14, 1, NULL, 'TXN-RZP-1793816076732-BB91', 1500.00, 'full', 'razorpay', 'pending', '2026-11-04 18:14:36', '2026-11-04 18:14:36', '2026-11-04 18:14:36', 'order_TwC2wqf07n7uXS', NULL, NULL),
(25, 14, 1, NULL, 'TXN-RZP-1793816350157-7460', 1500.00, 'full', 'razorpay', 'pending', '2026-11-04 18:19:10', '2026-11-04 18:19:10', '2026-11-04 18:19:10', 'order_TwC7lIhlW8Aa6U', NULL, NULL),
(26, 14, 1, NULL, 'TXN-RZP-1793816527765-415D', 1500.00, 'full', 'razorpay', 'success', '2026-11-04 18:22:07', '2026-11-04 18:22:07', '2026-11-04 18:22:53', 'order_TwCAtAayfMy8At', 'pay_TwCBD4NgxaFQRO', '81a99e63ede3a263459ad6dc9bdd175c64afd719c87deaa0589d8326030812b6'),
(27, 15, 1, NULL, 'TXN-RZP-1793816621611-90CC', 130.00, 'full', 'razorpay', 'pending', '2026-11-04 18:23:41', '2026-11-04 18:23:41', '2026-11-04 18:23:41', 'order_TwCCXbs9fZHNmH', NULL, NULL),
(28, 15, 1, NULL, 'TXN-RZP-1793816889704-06BE', 130.00, 'full', 'razorpay', 'success', '2026-11-04 18:28:09', '2026-11-04 18:28:09', '2026-11-04 18:29:16', 'order_TwCHGEmYXrTR2A', 'pay_TwCI3uzIVTC2lO', 'd089ad915cac55ea48655990138e1fd3ec53693bf8d3fc4aaaa1932fcb65ab26'),
(29, 16, 1, NULL, 'TXN-RZP-1793817191115-31C4', 300.00, 'full', 'razorpay', 'success', '2026-11-04 18:33:11', '2026-11-04 18:33:11', '2026-11-04 18:33:45', 'order_TwCMZEt3b3fcZw', 'pay_TwCMpbfOtKqqOc', '36d20ee50178caa3fa2cf991be9139c0e398a125f9e2bb0f40e86690753c8c79'),
(30, 17, 16, NULL, 'TXN-RZP-1794136490899-9714', 80.00, 'full', 'razorpay', 'pending', '2026-11-08 11:14:50', '2026-11-08 11:14:50', '2026-11-08 11:14:50', 'order_Txf1xdFdGzCDbo', NULL, NULL),
(31, 17, 16, NULL, 'TXN-RZP-1794136715410-3136', 80.00, 'full', 'razorpay', 'pending', '2026-11-08 11:18:35', '2026-11-08 11:18:35', '2026-11-08 11:18:35', 'order_Txf5ulzhxQ4TJI', NULL, NULL),
(32, 18, 1, NULL, 'TXN-RZP-1794136850478-736D', 500.00, 'full', 'razorpay', 'success', '2026-11-08 11:20:50', '2026-11-08 11:20:50', '2026-11-08 11:22:03', 'order_Txf8IBqvYTKlIU', 'pay_Txf99X2UimXECq', 'b1aa885488d37fb207b886c2080da6693afee536eeb71379f0c000e42e6ba8de'),
(33, 19, 16, NULL, 'TXN-RZP-1794136965742-FD37', 300.00, 'full', 'razorpay', 'success', '2026-11-08 11:22:45', '2026-11-08 11:22:45', '2026-11-08 11:23:18', 'order_TxfAK0kU7Mhq4O', 'pay_TxfAagvi8QZlQk', 'f384bc7b9c3f023fbf922a33a7200b368e4621b29ac9bfaebb28ef35b1c55d38'),
(34, 20, 1, NULL, 'TXN-RZP-1794986718899-721C', 40.00, 'full', 'razorpay', 'success', '2026-11-18 07:25:18', '2026-11-18 07:25:18', '2026-11-18 07:26:10', 'order_U1YSx1WIQqySQ3', 'pay_U1YTVjVXrsL2H1', 'e2ef7aa9db90799d31cb03737d02c37b0b0a75252312e5609da08dfe443d43ec'),
(35, 21, 1, NULL, 'TXN-RZP-1795364196408-B3EF', 40.00, 'full', 'razorpay', 'success', '2026-11-22 16:16:36', '2026-11-22 16:16:36', '2026-11-22 16:17:38', 'order_U3HeZBvk67wDj1', 'pay_U3HfGcXxZck7cL', '7a4bdddd6dc8a66d9358f0434c3eaf3eafe492c75c2752f7f06aeb5815e277ee'),
(36, 22, 18, NULL, 'TXN-RZP-1795367332330-24EC', 50.00, 'full', 'razorpay', 'success', '2026-11-22 17:08:52', '2026-11-22 17:08:52', '2026-11-22 17:10:06', 'order_U3IXm8K0NibGbs', 'pay_U3IYjnVVo8Fgwz', 'a68baf4f805175fdbdd3b89e90a42929ea918d05331c41b17e56c4b7de811355');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `total_quantity` int(11) NOT NULL DEFAULT 1,
  `price_hourly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_daily` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_weekly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_monthly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_yearly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deposit_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `category_id`, `name`, `description`, `image_url`, `total_quantity`, `price_hourly`, `price_daily`, `price_weekly`, `price_monthly`, `price_yearly`, `deposit_amount`, `is_active`, `created_at`, `updated_at`, `created_by`) VALUES
(356, 101, 'Electric City Scooter', 'Lightweight electric scooter for city commuting with 30km range.', 'https://image.made-in-china.com/229f0j00RaNGLVHImlUY/WeChat-20250515103224-mp4.webp', 10, 5.00, 25.00, 150.00, 450.00, 4500.00, 50.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(357, 102, 'Mountain Trail Bike', '21-speed suspension mountain bike for rough terrains.', 'https://dma.canyon.com/image/upload/w_425,h_536,c_fit/f_auto/q_auto/2026_Launch_Product_Lux-Trail_Web_Ridestyle_01_784x441_ALL_b6gjeb', 5, 8.00, 30.00, 180.00, 500.00, 5000.00, 100.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(358, 103, 'Compact Hatchback Car', 'Fuel-efficient 5-seater automatic car for daily city travel.', 'https://cdn-s3.autocarindia.com/Tata/tiago/Tata_Tiago_Facelift_Front_Quarter_Tracking.jpg?w=728&q=75&fm=auto', 3, 15.00, 75.00, 450.00, 1500.00, 15000.00, 500.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(359, 104, 'DSLR 4K Camera', 'Professional mirrorless camera with 18-55mm lens kit.', 'https://i.rtings.com/assets/pages/2ZDYEjJN/best-dslr-cameras-202107-medium.jpg?format=auto', 7, 12.00, 60.00, 350.00, 1000.00, 10000.00, 200.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(360, 105, '4K Aerial Drone', 'Foldable drone with 3-axis gimbal and 4K camera capabilities.', 'https://www.mystore.in/s/62ea2c599d1398fa16dbae0a/g/67f75c57aa905da201365db0/drone-420x420.jpg', 4, 20.00, 90.00, 500.00, 1400.00, 14000.00, 300.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(361, 106, 'High-Performance Laptop', '16GB RAM, 512GB SSD, ideal for development and gaming.', 'https://dlcdnrog.asus.com/rog/media/1789155853670.webp', 6, 10.00, 40.00, 220.00, 650.00, 6500.00, 150.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(362, 107, '55-inch Smart 4K TV', 'Ultra HD LED Smart TV with streaming apps built-in.', 'https://www.bigcmobiles.com/media/catalog/product/cache/e19e56cdd4cf1b4ec073d4305f5db95a/x/i/xiaomi_tv_x_8.png', 2, 7.00, 35.00, 200.00, 600.00, 6000.00, 120.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(363, 101, 'Pro Foldable E-Scooter', 'High-speed commuter scooter with dual suspension.', 'https://hoverboardsindia.in/wp-content/uploads/2025/09/Max-X1-pro-foldable-e-scooter-1.png', 8, 6.00, 30.00, 175.00, 500.00, 5000.00, 60.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(364, 102, 'Road Racing Bike', 'Aerodynamic lightweight carbon frame bike for speed.', 'https://www.sportnetwork.in/_next/image?url=https%3A%2F%2Fadmin.sportnetwork.in%2Fuploads%2Fproducts%2Fimages%2Fmedium%2FUhLuniwHg10XToyz.jpg&w=1080&q=75', 6, 9.00, 35.00, 210.00, 600.00, 6000.00, 150.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(365, 103, 'Luxury Sedan Car', 'Premium executive vehicle with leather interior and advanced safety.', 'https://www.topgear.com/sites/default/files/news-listicle/image/2023/09/LEAD.jpg?w=424&h=239', 2, 30.00, 150.00, 900.00, 3000.00, 30000.00, 1000.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(366, 104, 'Action Waterproof Camera', 'Compact action cam for extreme sports and underwater shooting.', 'https://media-assets.hyperinvento.com/companies/3a5f1158-d966-4bf9-8fbb-11e3b361b94b/products/f52ba039-485a-4e30-9e37-2e8d105809e4/featureds/images/b781c35b84cc4bf28e0a3d0356512124-product-featured-lg.jpg', 10, 6.00, 30.00, 180.00, 550.00, 5500.00, 100.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(367, 105, 'Mini Drone HD', 'Ultra-lightweight entry-level drone for beginner hobbyists.', 'http://zonealpha.in/cdn/shop/files/IMG-20260526-WA0034.jpg?v=1779780999', 8, 10.00, 45.00, 250.00, 750.00, 7500.00, 120.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(368, 106, 'Ultra-Slim Ultrabook Laptop', 'Lightweight aluminum laptop with retina display and long battery life.', 'https://cdn.mos.cms.futurecdn.net/8BHQFHBNDTS7hwEbVbnMGZ.jpg', 8, 9.00, 38.00, 200.00, 600.00, 6000.00, 130.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(369, 107, '65-inch OLED TV', 'Stunning picture quality with deep blacks and vibrant colors.', 'https://d3fppka8t5rpz7.cloudfront.net/filters:format(webp)/dev/images/agdhj_o2qMmKP.jpg', 3, 12.00, 55.00, 320.00, 950.00, 9500.00, 250.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(370, 101, 'Off-Road Electric Scooter', 'All-terrain heavy duty scooter with robust motor.', 'https://radboards.in/cdn/shop/files/Product_front_angle_view_202608201453.jpg?v=1787217832&width=1200', 4, 10.00, 45.00, 250.00, 750.00, 7500.00, 120.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(371, 102, 'City Commuter Bicycle', 'Comfortable upright riding position with a rear basket.', 'https://image.made-in-china.com/318f0j00zEMGZyBCHbgt/Wander-mp4.webp', 10, 4.00, 20.00, 120.00, 350.00, 3500.00, 50.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(372, 103, 'Family SUV Car', 'Spacious 7-seater sport utility vehicle for road trips.', 'https://autoxperia.in/_next/image?url=https%3A%2F%2Fd2dbmkua9abaw6.cloudfront.net%2Fuploads%2Fproducts%2FCarens-jpg-20260408-103925-776414490.jpeg&w=1080&q=75', 3, 25.00, 120.00, 750.00, 2500.00, 25000.00, 800.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(373, 104, 'Cinematic Full-Frame Camera', 'High-end cinema camera body for professional filmmakers.', 'https://media-assets.hyperinvento.com/companies/3a5f1158-d966-4bf9-8fbb-11e3b361b94b/products/2e6eb2ae-a225-44a8-a2b0-de141fa1da54/featureds/images/6d14531a8fc2437cb7af0e032707ed6f-product-featured-lg.jpg', 3, 35.00, 160.00, 950.00, 3200.00, 32000.00, 800.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(374, 105, 'Enterprise Inspection Drone', 'Thermal imaging and long-range transmission drone for commercial use.', 'https://voliro.com/wp-content/uploads/2024/07/Voliro-T-drone-setup-with-UT-payload.jpg', 2, 50.00, 220.00, 1300.00, 4500.00, 45000.00, 1500.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(375, 106, 'Extreme Gaming Laptop', 'Equipped with dedicated graphics and high refresh rate screen.', 'https://img.etradeasia.com/customer/343940/comm/upimage/p_230113_06708.jpg', 5, 15.00, 65.00, 380.00, 1200.00, 12000.00, 350.00, 1, '2026-10-30 17:17:11', '2026-10-30 17:17:11', NULL),
(416, 201, 'Studio Monitor Speakers', 'Professional active studio monitors for precise audio mixing and mastering.', 'https://audioarray.in/cdn/shop/files/01_28751fb5-cff3-45f5-a349-6b9ed11dedf2.jpg?v=1765003903&width=1920', 6, 6.00, 28.00, 160.00, 480.00, 4800.00, 80.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(417, 201, 'Wireless Bluetooth Party Speaker', 'High-output portable party speaker with deep bass and light effects.', 'https://www.blaupunktaudio.in/cdn/shop/files/ATOMIKLYTZ_1.jpg?v=1754817167', 8, 5.00, 22.00, 130.00, 390.00, 3900.00, 60.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(418, 201, 'Professional DJ Mixing Console', 'Multi-channel digital DJ mixer with performance pads and effects.', 'https://www.pioneerdj.com/product-images/2782/78b74aa8-c02a-4332-b474-6f3f748ad67e/djm-v5_lifestyle2.webp', 3, 15.00, 70.00, 400.00, 1200.00, 12000.00, 300.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(419, 201, 'Noise-Canceling Studio Headphones', 'Over-ear studio monitoring headphones with flat frequency response.', 'https://www.headphonezone.in/cdn/shop/files/Headphone-Zone-Studio-Proffesional-2.jpg?v=1790316286&width=1200', 12, 3.00, 15.00, 85.00, 250.00, 2500.00, 40.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(420, 201, 'Wireless Lavalier Microphone System', 'Dual-channel clip-on wireless microphone for crystal clear vocal recording.', 'https://dlcdnrog.asus.com/rog/media/1789155853670.webp', 10, 4.00, 20.00, 110.00, 320.00, 3200.00, 50.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(421, 202, 'Mirrorless Vlog Camera', 'Compact interchangeable lens camera optimized for content creation.', 'https://shopatsc.com/cdn/shop/products/ZV-E10-01.jpg?v=1697630881', 5, 10.00, 50.00, 300.00, 900.00, 9000.00, 200.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(422, 202, 'Professional Ring Light Kit', '18-inch dimmable LED ring light with adjustable tripod stand.', 'https://www.riobeauty.com/cdn/shop/products/09_Product_Shot_RL18_01-WEB_2000x.jpg?v=1644490545', 7, 4.00, 18.00, 95.00, 280.00, 2800.00, 45.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(423, 202, 'Carbon Fiber Camera Tripod', 'Lightweight yet ultra-stable professional tripod with ball head.', 'https://fotocentreindia.com/wp-content/uploads/Peak-Design-Carbon-Fibre-Tripod-Online-Buy-Mumbai-India_7.jpg', 6, 5.00, 24.00, 140.00, 420.00, 4200.00, 70.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(424, 202, 'Wide-Angle Prime Lens', 'High-aperture prime lens for dramatic landscapes and interior shots.', 'https://photographylife.com/cdn-cgi/imagedelivery/GrQZt6ZFhE4jsKqjDEtqRA/photographylife.com/2019/10/Best-wide-angle-lenses-for-Nikon-DSLRs.jpg/w=960', 4, 8.00, 35.00, 200.00, 600.00, 6000.00, 150.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(425, 202, 'Portable LED Video Light Panel', 'Bicolor adjustable soft lighting panel for on-the-go video shoots.', 'http://www.digitek.net.in/cdn/shop/files/Artboard1.png?v=1741435035&width=2048', 8, 4.50, 20.00, 115.00, 340.00, 3400.00, 50.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(426, 203, 'Commercial Popcorn Machine', 'Heavy-duty theater-style popcorn maker for parties and events.', 'https://image.made-in-china.com/229f0j00bTeRIUaCmqzE/260330-mp4.webp', 4, 7.00, 35.00, 200.00, 600.00, 6000.00, 100.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(427, 203, 'Professional Fog Machine', 'High-output smoke machine with wireless remote for stage and parties.', 'http://www.hiffin.in/cdn/shop/files/1_570be0de-34cd-44e2-b052-8970dfbee38c.jpg?v=1776148813', 6, 6.00, 30.00, 175.00, 500.00, 5000.00, 90.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(428, 203, 'LED Party Disco Ball Light', 'Sound-activated rotating crystal magic ball for club-like ambiance.', 'https://deodap.in/cdn/shop/files/7548.png?v=1786773819', 10, 2.50, 12.00, 65.00, 190.00, 1900.00, 30.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(429, 203, 'Heavy-Duty Folding Event Tent', 'Waterproof pop-up canopy marquee gazebo for outdoor exhibitions.', 'https://image.made-in-china.com/202f0j00kILeEfSKgRbh/Durable-Material-Waterproof-Canopy-Tent-with-Adjustable-Height-for-Festivals-Fold-Canopy-Marquee-Camp-Gazebo-Trade-Show-Camping-Outdoor-Event-Exhibition.webp', 3, 12.00, 55.00, 320.00, 950.00, 9500.00, 200.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(430, 203, 'Portable Outdoor Projector Screen', 'Easy-assemble fast-fold screen for outdoor movie nights and presentations.', 'https://www.bigcmobiles.com/media/catalog/product/cache/e19e56cdd4cf1b4ec073d4305f5db95a/x/i/xiaomi_tv_x_8.png', 5, 5.00, 25.00, 150.00, 450.00, 4500.00, 80.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(431, 204, 'Electric Commuter Kick Scooter', 'Sleek folding electric scooter for swift urban transit.', 'http://radboards.in/cdn/shop/files/subbareddy_ShippingLabel_2.jpg?v=1787146611', 10, 5.00, 25.00, 150.00, 450.00, 4500.00, 50.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(432, 204, 'Folding City Bicycle', 'Compact aluminum frame bike that folds easily for storage and transport.', 'https://image.made-in-china.com/318f0j00ntlfzIUbsqgC/1-8-2-mp4.webp', 7, 4.00, 20.00, 120.00, 360.00, 3600.00, 60.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(433, 204, 'Electric Balance Hoverboard', 'Self-balancing smart hoverboard with built-in LED wheel lights.', 'http://fliptoy.in/cdn/shop/products/hoverboarderdserfsdf.jpg?v=1698403699', 8, 4.50, 22.00, 130.00, 390.00, 3900.00, 55.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(434, 204, 'All-Terrain Mountain E-Bike', 'Rugged electric bicycle equipped with full suspension and fat tires.', 'https://www.gleecycle.com/cdn/shop/files/product_image_Silvertip8_31.webp?v=1778847416&width=1200', 4, 12.00, 50.00, 300.00, 900.00, 9000.00, 250.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(435, 204, 'Compact Urban Moped', 'Reliable two-wheeled electric moped designed for city commutes.', 'https://image.made-in-china.com/2f0j00SKuqJMifEGgv/Urban-Commuter-Scooter-Compact-Two-Wheeled-Motorcycle-for-City-Travel-Ebike.jpg', 3, 14.00, 60.00, 350.00, 1050.00, 10500.00, 300.00, 1, '2026-10-30 17:26:57', '2026-10-30 17:26:57', NULL),
(496, 201, 'Studio Monitor Speakers', 'Professional active studio monitors for precise audio mixing and mastering.', 'https://audioarray.in/cdn/shop/files/01_28751fb5-cff3-45f5-a349-6b9ed11dedf2.jpg?v=1765003903&width=1920', 6, 6.00, 28.00, 160.00, 480.00, 4800.00, 80.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(497, 201, 'Wireless Bluetooth Party Speaker', 'High-output portable party speaker with deep bass and light effects.', 'https://www.blaupunktaudio.in/cdn/shop/files/ATOMIKLYTZ_1.jpg?v=1754817167', 8, 5.00, 22.00, 130.00, 390.00, 3900.00, 60.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(498, 201, 'Professional DJ Mixing Console', 'Multi-channel digital DJ mixer with performance pads and effects.', 'https://www.pioneerdj.com/product-images/2782/78b74aa8-c02a-4332-b474-6f3f748ad67e/djm-v5_lifestyle2.webp', 3, 15.00, 70.00, 400.00, 1200.00, 12000.00, 300.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(499, 201, 'Noise-Canceling Studio Headphones', 'Over-ear studio monitoring headphones with flat frequency response.', 'https://www.headphonezone.in/cdn/shop/files/Headphone-Zone-Studio-Proffesional-2.jpg?v=1790316286&width=1200', 12, 3.00, 15.00, 85.00, 250.00, 2500.00, 40.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(500, 201, 'Wireless Lavalier Microphone System', 'Dual-channel clip-on wireless microphone for crystal clear vocal recording.', 'https://dlcdnrog.asus.com/rog/media/1789155853670.webp', 10, 4.00, 20.00, 110.00, 320.00, 3200.00, 50.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(501, 202, 'Mirrorless Vlog Camera', 'Compact interchangeable lens camera optimized for content creation.', 'https://shopatsc.com/cdn/shop/products/ZV-E10-01.jpg?v=1697630881', 5, 10.00, 50.00, 300.00, 900.00, 9000.00, 200.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(502, 202, 'Professional Ring Light Kit', '18-inch dimmable LED ring light with adjustable tripod stand.', 'https://www.riobeauty.com/cdn/shop/products/09_Product_Shot_RL18_01-WEB_2000x.jpg?v=1644490545', 7, 4.00, 18.00, 95.00, 280.00, 2800.00, 45.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(503, 202, 'Carbon Fiber Camera Tripod', 'Lightweight yet ultra-stable professional tripod with ball head.', 'https://fotocentreindia.com/wp-content/uploads/Peak-Design-Carbon-Fibre-Tripod-Online-Buy-Mumbai-India_7.jpg', 6, 5.00, 24.00, 140.00, 420.00, 4200.00, 70.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(504, 202, 'Wide-Angle Prime Lens', 'High-aperture prime lens for dramatic landscapes and interior shots.', 'https://photographylife.com/cdn-cgi/imagedelivery/GrQZt6ZFhE4jsKqjDEtqRA/photographylife.com/2019/10/Best-wide-angle-lenses-for-Nikon-DSLRs.jpg/w=960', 4, 8.00, 35.00, 200.00, 600.00, 6000.00, 150.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(505, 202, 'Portable LED Video Light Panel', 'Bicolor adjustable soft lighting panel for on-the-go video shoots.', 'http://www.digitek.net.in/cdn/shop/files/Artboard1.png?v=1741435035&width=2048', 8, 4.50, 20.00, 115.00, 340.00, 3400.00, 50.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(506, 4, 'Commercial Popcorn Machine', 'Heavy-duty theater-style popcorn maker for parties and events.', 'https://image.made-in-china.com/229f0j00bTeRIUaCmqzE/260330-mp4.webp', 4, 7.00, 35.00, 200.00, 600.00, 6000.00, 100.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(507, 4, 'Professional Fog Machine', 'High-output smoke machine with wireless remote for stage and parties.', 'http://www.hiffin.in/cdn/shop/files/1_570be0de-34cd-44e2-b052-8970dfbee38c.jpg?v=1776148813', 6, 6.00, 30.00, 175.00, 500.00, 5000.00, 90.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(508, 4, 'LED Party Disco Ball Light', 'Sound-activated rotating crystal magic ball for club-like ambiance.', 'https://deodap.in/cdn/shop/files/7548.png?v=1786773819', 10, 2.50, 12.00, 65.00, 190.00, 1900.00, 30.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(509, 4, 'Heavy-Duty Folding Event Tent', 'Waterproof pop-up canopy marquee gazebo for outdoor exhibitions.', 'https://image.made-in-china.com/202f0j00kILeEfSKgRbh/Durable-Material-Waterproof-Canopy-Tent-with-Adjustable-Height-for-Festivals-Fold-Canopy-Marquee-Camp-Gazebo-Trade-Show-Camping-Outdoor-Event-Exhibition.webp', 3, 12.00, 55.00, 320.00, 950.00, 9500.00, 200.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(510, 4, 'Portable Outdoor Projector Screen', 'Easy-assemble fast-fold screen for outdoor movie nights and presentations.', 'https://www.bigcmobiles.com/media/catalog/product/cache/e19e56cdd4cf1b4ec073d4305f5db95a/x/i/xiaomi_tv_x_8.png', 5, 5.00, 25.00, 150.00, 450.00, 4500.00, 80.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(511, 5, 'Electric Commuter Kick Scooter', 'Sleek folding electric scooter for swift urban transit.', 'http://radboards.in/cdn/shop/files/subbareddy_ShippingLabel_2.jpg?v=1787146611', 10, 5.00, 25.00, 150.00, 450.00, 4500.00, 50.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(512, 5, 'Folding City Bicycle', 'Compact aluminum frame bike that folds easily for storage and transport.', 'https://image.made-in-china.com/318f0j00ntlfzIUbsqgC/1-8-2-mp4.webp', 7, 4.00, 20.00, 120.00, 360.00, 3600.00, 60.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(513, 5, 'Electric Balance Hoverboard', 'Self-balancing smart hoverboard with built-in LED wheel lights.', 'http://fliptoy.in/cdn/shop/products/hoverboarderdserfsdf.jpg?v=1698403699', 8, 4.50, 22.00, 130.00, 390.00, 3900.00, 55.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(514, 5, 'All-Terrain Mountain E-Bike', 'Rugged electric bicycle equipped with full suspension and fat tires.', 'https://www.gleecycle.com/cdn/shop/files/product_image_Silvertip8_31.webp?v=1778847416&width=1200', 4, 12.00, 50.00, 300.00, 900.00, 9000.00, 250.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(515, 5, 'Compact Urban Moped', 'Reliable two-wheeled electric moped designed for city commutes.', 'https://image.made-in-china.com/2f0j00SKuqJMifEGgv/Urban-Commuter-Scooter-Compact-Two-Wheeled-Motorcycle-for-City-Travel-Ebike.jpg', 3, 14.00, 60.00, 350.00, 1050.00, 10500.00, 300.00, 1, '2026-10-30 17:34:35', '2026-10-30 17:34:35', NULL),
(517, 201, 'PTron speaker', 'Ptron speaker 3 set', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgh4ZrfYACPUDMTaW2wrZto8nEq70SPVmngrCf5ym0RQ&s', 1, 200.00, 1000.00, 5000.00, 30000.00, 50000.00, 500.00, 1, '2026-11-01 17:43:26', '2026-11-22 17:12:13', 1),
(518, 106, 'ps5', 'ps5', '/uploads/products/product_1793612584952_8907b63cbd0d7f68.jpg', 1, 500.00, 1000.00, 10000.00, 30000.00, 1000000.00, 499.85, 1, '2026-11-02 09:43:05', '2026-11-02 09:43:05', 1),
(520, 201, 'PS5', 'someone ps5', '/uploads/products/product_1793615157120_da834cc2c6d280e4.jpg', 1, 410.00, 500.00, 1000.00, 5000.00, 10000.00, 500.00, 0, '2026-11-02 10:25:57', '2026-11-22 16:34:05', NULL),
(522, 4, 'Flower sticker for partys', 'stickers', '/uploads/products/product_f82a16f6efc74384b7e70970e9a3b0d4.png', 10, 50.00, 100.00, 500.00, 2000.00, 10000.00, 50.00, 1, '2026-11-22 16:36:31', '2026-11-22 16:36:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `rentals`
--

CREATE TABLE `rentals` (
  `rental_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `booking_number` varchar(50) NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `duration_unit` enum('hour','day','week','month','year') NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `security_deposit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','approved','active','completed','cancelled','rejected') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','partial','paid','refunded') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rentals`
--

INSERT INTO `rentals` (`rental_id`, `user_id`, `booking_number`, `start_datetime`, `end_datetime`, `duration_unit`, `total_amount`, `security_deposit`, `status`, `payment_status`, `created_at`, `updated_at`) VALUES
(2, 3, 'RNT-20261024-94EFBE', '2026-10-25 03:30:00', '2026-10-25 04:30:00', 'hour', 15000.00, 5000.00, 'cancelled', 'pending', '2026-10-24 09:01:26', '2026-10-24 09:07:34'),
(3, 3, 'RNT-20261024-90E6A5', '2026-10-25 03:37:00', '2026-10-25 04:37:00', 'hour', 15000.00, 5000.00, 'cancelled', 'pending', '2026-10-24 09:08:03', '2026-10-27 08:27:50'),
(4, 3, 'RNT-20261027-027ED9', '2026-10-28 02:56:00', '2026-10-29 02:56:00', 'day', 55000.00, 5000.00, 'cancelled', 'pending', '2026-10-27 08:26:38', '2026-10-27 08:27:48'),
(5, 3, 'RNT-20261030-14B0C9', '2026-10-31 11:24:00', '2026-11-01 11:24:00', 'day', 9500.00, 8000.00, 'active', 'pending', '2026-10-30 16:54:22', '2026-11-22 16:18:26'),
(6, 6, 'RNT-20261102-44F90F', '2026-11-03 03:39:00', '2026-11-05 03:39:00', 'day', 2500.00, 500.00, 'active', 'pending', '2026-11-02 09:11:31', '2026-11-22 16:18:25'),
(7, 1, 'RNT-20261102-5B22AB', '2026-11-03 03:52:00', '2026-11-05 03:52:00', 'day', 420.00, 300.00, 'cancelled', 'pending', '2026-11-02 09:22:07', '2026-11-02 09:27:54'),
(8, 1, 'RNT-20261102-C2802A', '2026-11-03 03:52:00', '2026-11-05 03:52:00', 'day', 420.00, 300.00, 'cancelled', 'pending', '2026-11-02 09:26:08', '2026-11-02 09:27:52'),
(9, 1, 'RNT-20261102-0D7CA8', '2026-11-03 03:52:00', '2026-11-05 03:52:00', 'day', 420.00, 300.00, 'cancelled', 'pending', '2026-11-02 09:26:10', '2026-11-02 09:27:50'),
(10, 1, 'RNT-20261102-63DA47', '2026-11-03 04:56:00', '2026-11-05 04:56:00', 'day', 1500.00, 500.00, 'cancelled', 'pending', '2026-11-02 10:26:51', '2026-11-02 10:27:23'),
(11, 1, 'RNT-20261102-C05D2A', '2026-11-03 04:57:00', '2026-11-05 04:57:00', 'day', 1500.00, 500.00, 'cancelled', 'pending', '2026-11-02 10:27:32', '2026-11-04 17:52:56'),
(12, 16, 'RNT-20261102-090AAF', '2026-11-03 05:32:00', '2026-11-05 05:32:00', 'day', 420.00, 300.00, 'cancelled', 'pending', '2026-11-02 11:02:06', '2026-11-02 11:07:55'),
(13, 16, 'RNT-20261102-BBE643', '2026-11-03 05:32:00', '2026-11-05 05:32:00', 'day', 420.00, 300.00, 'cancelled', 'pending', '2026-11-02 11:02:49', '2026-11-02 11:07:53'),
(14, 1, 'RNT-20261104-4C27A4', '2026-11-05 12:23:00', '2026-11-07 12:23:00', 'day', 1500.00, 500.00, 'cancelled', 'paid', '2026-11-04 17:53:05', '2026-11-04 18:23:21'),
(15, 1, 'RNT-20261104-E40A5C', '2026-11-05 12:53:00', '2026-11-07 12:53:00', 'day', 130.00, 80.00, 'active', 'paid', '2026-11-04 18:23:33', '2026-11-22 16:18:22'),
(16, 1, 'RNT-20261104-1D066D', '2026-11-05 13:03:00', '2026-11-07 13:03:00', 'day', 300.00, 200.00, 'active', 'paid', '2026-11-04 18:33:06', '2026-11-22 16:18:21'),
(17, 16, 'RNT-20261108-AFC822', '2026-11-09 05:44:00', '2026-11-11 05:44:00', 'day', 80.00, 80.00, 'rejected', 'pending', '2026-11-08 11:14:45', '2026-11-18 07:26:57'),
(18, 1, 'RNT-20261108-57AD0C', '2026-11-09 05:50:00', '2026-11-11 05:50:00', 'day', 500.00, 500.00, 'active', 'paid', '2026-11-08 11:20:46', '2026-11-22 16:18:20'),
(19, 16, 'RNT-20261108-DB32CF', '2026-11-09 05:52:00', '2026-11-11 05:52:00', 'day', 300.00, 300.00, 'active', 'paid', '2026-11-08 11:22:41', '2026-11-22 16:18:20'),
(20, 1, 'RNT-20261118-F726E5', '2026-11-19 01:55:00', '2026-11-21 01:55:00', 'day', 40.00, 40.00, 'active', 'paid', '2026-11-18 07:25:13', '2026-11-22 16:18:18'),
(21, 1, 'RNT-20261122-727864', '2026-11-23 10:34:00', '2026-11-25 10:34:00', 'day', 40.00, 40.00, 'active', 'paid', '2026-11-22 16:04:45', '2026-11-22 16:18:17'),
(22, 18, 'RNT-20261122-8BE92F', '2026-11-23 11:38:00', '2026-11-25 11:38:00', 'day', 50.00, 50.00, 'pending', 'paid', '2026-11-22 17:08:49', '2026-11-22 17:10:06');

-- --------------------------------------------------------

--
-- Table structure for table `rental_items`
--

CREATE TABLE `rental_items` (
  `rental_item_id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rental_items`
--

INSERT INTO `rental_items` (`rental_item_id`, `rental_id`, `product_id`, `quantity`, `unit_price`, `subtotal`, `created_at`, `updated_at`) VALUES
(5, 5, 354, 1, 1500.00, 1500.00, '2026-10-30 16:54:22', '2026-10-30 16:54:22'),
(6, 6, 517, 1, 1000.00, 2000.00, '2026-11-02 09:11:31', '2026-11-02 09:11:31'),
(7, 7, 515, 1, 60.00, 120.00, '2026-11-02 09:22:07', '2026-11-02 09:22:07'),
(8, 8, 515, 1, 60.00, 120.00, '2026-11-02 09:26:08', '2026-11-02 09:26:08'),
(9, 9, 515, 1, 60.00, 120.00, '2026-11-02 09:26:10', '2026-11-02 09:26:10'),
(10, 10, 520, 1, 500.00, 1000.00, '2026-11-02 10:26:51', '2026-11-02 10:26:51'),
(11, 11, 520, 1, 500.00, 1000.00, '2026-11-02 10:27:32', '2026-11-02 10:27:32'),
(12, 12, 515, 1, 60.00, 120.00, '2026-11-02 11:02:06', '2026-11-02 11:02:06'),
(13, 13, 515, 1, 60.00, 120.00, '2026-11-02 11:02:49', '2026-11-02 11:02:49'),
(14, 14, 520, 1, 500.00, 1000.00, '2026-11-04 17:53:05', '2026-11-04 17:53:05'),
(15, 15, 510, 1, 25.00, 50.00, '2026-11-04 18:23:33', '2026-11-04 18:23:33'),
(16, 16, 501, 1, 50.00, 100.00, '2026-11-04 18:33:06', '2026-11-04 18:33:06'),
(17, 17, 510, 1, 0.00, 0.00, '2026-11-08 11:14:45', '2026-11-08 11:14:45'),
(18, 18, 520, 1, 0.00, 0.00, '2026-11-08 11:20:46', '2026-11-08 11:20:46'),
(19, 19, 515, 1, 0.00, 0.00, '2026-11-08 11:22:41', '2026-11-08 11:22:41'),
(20, 20, 499, 1, 0.00, 0.00, '2026-11-18 07:25:13', '2026-11-18 07:25:13'),
(21, 21, 499, 1, 0.00, 0.00, '2026-11-22 16:04:45', '2026-11-22 16:04:45'),
(22, 22, 522, 1, 0.00, 0.00, '2026-11-22 17:08:49', '2026-11-22 17:08:49');

-- --------------------------------------------------------

--
-- Table structure for table `returns`
--

CREATE TABLE `returns` (
  `return_id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `scheduled_return_datetime` datetime NOT NULL,
  `actual_return_datetime` datetime NOT NULL,
  `condition_on_return` enum('good','minor_damage','severe_damage') NOT NULL DEFAULT 'good',
  `admin_notes` text DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `security_deposits`
--

CREATE TABLE `security_deposits` (
  `deposit_id` int(11) NOT NULL,
  `rental_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('held','refunded','partially_refunded','forfeited','PENDING','PARTIAL','PAID','REFUNDED','ADJUSTED') NOT NULL DEFAULT 'PENDING',
  `refunded_amount` decimal(10,2) DEFAULT 0.00,
  `forfeited_amount` decimal(10,2) DEFAULT 0.00,
  `refund_transaction_id` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deposit_number` varchar(100) DEFAULT NULL,
  `paid_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `adjusted_amount` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `security_deposit_logs`
--

CREATE TABLE `security_deposit_logs` (
  `log_id` int(11) NOT NULL,
  `deposit_id` int(11) NOT NULL,
  `action_type` enum('PAYMENT','REFUND','PARTIAL_REFUND','ADJUSTMENT_DAMAGE','ADJUSTMENT_DUES') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `remaining_balance` decimal(10,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seller_profiles`
--

CREATE TABLE `seller_profiles` (
  `seller_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `store_name` varchar(150) NOT NULL,
  `store_description` text DEFAULT NULL,
  `pickup_address` varchar(1000) NOT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `seller_number` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `seller_profiles`
--

INSERT INTO `seller_profiles` (`seller_id`, `user_id`, `store_name`, `store_description`, `pickup_address`, `gstin`, `status`, `admin_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`, `seller_number`) VALUES
(8, 16, 'shubham jewellers', 'trusted hai bhaio', 'thaltewj unknown', NULL, 'approved', NULL, NULL, '2026-11-02 10:51:37', '2026-11-02 10:51:14', '2026-11-02 10:51:37', 52286301);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('customer','seller','admin') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `google_id` varchar(255) DEFAULT NULL,
  `auth_provider` enum('EMAIL','GOOGLE') NOT NULL DEFAULT 'EMAIL',
  `profile_image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `phone`, `role`, `created_at`, `updated_at`, `google_id`, `auth_provider`, `profile_image`) VALUES
(1, 'Vansh Soni', 'vanshsoni0313@gmail.com', '$2a$10$I.cS.M.UG3J3lURlyr8r2u0vjG/vF3ccCVPNAAaik8.3U5NL/pX/2', '7016267258', 'customer', '2026-10-24 08:34:24', '2026-10-30 17:56:37', NULL, 'EMAIL', NULL),
(3, 'meet patel', 'meet@gmail.com', '$2a$10$f7J1DWTuMhMKoYKnwGDjiO2Dfm/wnvXv1tnr.l8hWIAJyKNBQn25W', '07016267258', 'customer', '2026-10-24 08:57:07', '2026-10-24 08:57:07', NULL, 'EMAIL', NULL),
(6, 'admin', 'admin@gmail.com', '$2b$10$1xofQROotKKSLtjxgb3h.e7TQ2YFrxqXOI9q4rkDz4bvRhqyz3Xdm', '1234567890', 'admin', '2026-10-30 12:23:11', '2026-11-22 16:54:56', NULL, 'EMAIL', NULL),
(16, 'soni khushi', 'khushi@gmail.com', '$2a$10$s3m07FWfCRSVupPmApmB6ebKtwyF/Jqg.HpDqeeyTjWaXH.Lk8xJe', '1234567890', 'seller', '2026-11-02 10:51:14', '2026-11-02 10:51:14', NULL, 'EMAIL', NULL),
(18, 'Test User', 'test@gmail.com', '$2b$10$/C0fi5L55klTSZ.frEnUI.KYOyHAXJQJyHAzW0PGrPaTHqQbjGFsm', NULL, 'customer', '2026-11-22 16:47:39', '2026-11-22 16:47:39', NULL, 'EMAIL', NULL),
(20, 'admin2', 'admin2@gmail.com', '$2b$10$1xofQROotKKSLtjxgb3h.e7TQ2YFrxqXOI9q4rkDz4bvRhqyz3Xdm', NULL, 'admin', '2026-11-22 16:57:45', '2026-11-22 16:57:45', NULL, 'EMAIL', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`invoice_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD UNIQUE KEY `idx_unique_user_billing_month` (`user_id`,`billing_month`),
  ADD KEY `idx_invoices_user` (`user_id`),
  ADD KEY `idx_invoices_rental` (`rental_id`),
  ADD KEY `idx_invoices_number` (`invoice_number`),
  ADD KEY `idx_invoices_status` (`status`),
  ADD KEY `idx_invoices_billing_month` (`billing_month`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`invoice_item_id`),
  ADD KEY `idx_invoice_items_invoice` (`invoice_id`);

--
-- Indexes for table `late_fees`
--
ALTER TABLE `late_fees`
  ADD PRIMARY KEY (`late_fee_id`),
  ADD KEY `idx_late_fees_return` (`return_id`),
  ADD KEY `idx_late_fees_status` (`status`);

--
-- Indexes for table `late_fee_configs`
--
ALTER TABLE `late_fee_configs`
  ADD PRIMARY KEY (`config_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_read` (`is_read`),
  ADD KEY `idx_notifications_type` (`type`),
  ADD KEY `idx_notifications_reference` (`reference_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_payments_rental` (`rental_id`),
  ADD KEY `idx_payments_user` (`user_id`),
  ADD KEY `idx_payments_invoice` (`invoice_id`),
  ADD KEY `idx_payments_tx` (`transaction_id`),
  ADD KEY `idx_payments_status` (`status`),
  ADD KEY `idx_payments_razorpay_order` (`razorpay_order_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_active` (`is_active`),
  ADD KEY `idx_products_name` (`name`),
  ADD KEY `idx_products_created_by` (`created_by`);

--
-- Indexes for table `rentals`
--
ALTER TABLE `rentals`
  ADD PRIMARY KEY (`rental_id`),
  ADD UNIQUE KEY `booking_number` (`booking_number`),
  ADD KEY `idx_rentals_user` (`user_id`),
  ADD KEY `idx_rentals_status` (`status`),
  ADD KEY `idx_rentals_dates` (`start_datetime`,`end_datetime`),
  ADD KEY `idx_rentals_booking_no` (`booking_number`);

--
-- Indexes for table `rental_items`
--
ALTER TABLE `rental_items`
  ADD PRIMARY KEY (`rental_item_id`),
  ADD KEY `idx_rental_items_rental` (`rental_id`),
  ADD KEY `idx_rental_items_product` (`product_id`);

--
-- Indexes for table `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`return_id`),
  ADD KEY `idx_returns_rental` (`rental_id`);

--
-- Indexes for table `security_deposits`
--
ALTER TABLE `security_deposits`
  ADD PRIMARY KEY (`deposit_id`),
  ADD UNIQUE KEY `refund_transaction_id` (`refund_transaction_id`),
  ADD KEY `idx_security_deposits_rental` (`rental_id`),
  ADD KEY `idx_security_deposits_user` (`user_id`),
  ADD KEY `idx_security_deposits_status` (`status`);

--
-- Indexes for table `security_deposit_logs`
--
ALTER TABLE `security_deposit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_deposit_logs_deposit` (`deposit_id`),
  ADD KEY `idx_deposit_logs_action` (`action_type`);

--
-- Indexes for table `seller_profiles`
--
ALTER TABLE `seller_profiles`
  ADD PRIMARY KEY (`seller_id`),
  ADD UNIQUE KEY `uq_seller_profiles_user` (`user_id`),
  ADD UNIQUE KEY `uq_seller_profiles_seller_number` (`seller_number`),
  ADD KEY `idx_seller_profiles_status` (`status`),
  ADD KEY `fk_seller_profiles_reviewer` (`reviewed_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_google_id` (`google_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=205;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `invoice_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `invoice_item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `late_fees`
--
ALTER TABLE `late_fees`
  MODIFY `late_fee_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `late_fee_configs`
--
ALTER TABLE `late_fee_configs`
  MODIFY `config_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=523;

--
-- AUTO_INCREMENT for table `rentals`
--
ALTER TABLE `rentals`
  MODIFY `rental_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `rental_items`
--
ALTER TABLE `rental_items`
  MODIFY `rental_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `returns`
--
ALTER TABLE `returns`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `security_deposits`
--
ALTER TABLE `security_deposits`
  MODIFY `deposit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `security_deposit_logs`
--
ALTER TABLE `security_deposit_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seller_profiles`
--
ALTER TABLE `seller_profiles`
  MODIFY `seller_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`rental_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_invoices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `late_fees`
--
ALTER TABLE `late_fees`
  ADD CONSTRAINT `fk_late_fees_return` FOREIGN KEY (`return_id`) REFERENCES `returns` (`return_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payments_rental` FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`rental_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `security_deposit_logs`
--
ALTER TABLE `security_deposit_logs`
  ADD CONSTRAINT `fk_deposit_logs_deposit` FOREIGN KEY (`deposit_id`) REFERENCES `security_deposits` (`deposit_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `seller_profiles`
--
ALTER TABLE `seller_profiles`
  ADD CONSTRAINT `fk_seller_profiles_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_seller_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
