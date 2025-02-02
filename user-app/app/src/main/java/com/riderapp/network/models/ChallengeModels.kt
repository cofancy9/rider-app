package com.riderapp.network.models

data class Challenge(
    val id: String,
    val name: String,
    val type: String,
    val minDistance: Int,
    val maxDistance: Int,
    val timeLimit: Int,
    val entryFee: Double,
    val reward: Double,
    val status: String,
    val participants: List<String> = emptyList(),
    val rules: List<String> = emptyList()
)

data class ChallengeResponse(
    val status: String,
    val data: Challenge?,
    val message: String?
)

data class ChallengeListResponse(
    val status: String,
    val data: List<Challenge>,
    val message: String?
)
