/**
 * @swagger
 * components:
 *   schemas:
 *     SlackChannel:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: C1234567890
 *         name:
 *           type: string
 *           example: general
 *         is_channel:
 *           type: boolean
 *         is_group:
 *           type: boolean
 *         is_im:
 *           type: boolean
 *         is_mpim:
 *           type: boolean
 *         is_private:
 *           type: boolean
 *         is_archived:
 *           type: boolean
 *         is_general:
 *           type: boolean
 *         is_shared:
 *           type: boolean
 *         is_org_shared:
 *           type: boolean
 *         is_member:
 *           type: boolean
 *         num_members:
 *           type: number
 *         topic:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *             creator:
 *               type: string
 *             last_set:
 *               type: number
 *         purpose:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *             creator:
 *               type: string
 *             last_set:
 *               type: number
 *     
 *     SlackMessage:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           example: message
 *         channel:
 *           type: string
 *           example: C1234567890
 *         user:
 *           type: string
 *           example: U1234567890
 *         text:
 *           type: string
 *           example: Hello, world!
 *         ts:
 *           type: string
 *           example: 1234567890.123456
 *         thread_ts:
 *           type: string
 *           example: 1234567890.123456
 *         blocks:
 *           type: array
 *           items:
 *             type: object
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *     
 *     SlackUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: U1234567890
 *         team_id:
 *           type: string
 *           example: T1234567890
 *         name:
 *           type: string
 *           example: johndoe
 *         real_name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john.doe@example.com
 *         is_admin:
 *           type: boolean
 *         is_owner:
 *           type: boolean
 *         is_bot:
 *           type: boolean
 *         is_app_user:
 *           type: boolean
 *         profile:
 *           type: object
 *           properties:
 *             avatar_hash:
 *               type: string
 *             status_text:
 *               type: string
 *             status_emoji:
 *               type: string
 *             real_name:
 *               type: string
 *             display_name:
 *               type: string
 *             email:
 *               type: string
 *             image_24:
 *               type: string
 *             image_48:
 *               type: string
 *             image_72:
 *               type: string
 *     
 *     SlackBotInfo:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: U1234567890
 *         botId:
 *           type: string
 *           example: B1234567890
 *         teamId:
 *           type: string
 *           example: T1234567890
 *         team:
 *           type: string
 *           example: My Workspace
 *     
 *     SendMessageRequest:
 *       type: object
 *       required:
 *         - channel
 *         - text
 *       properties:
 *         channel:
 *           type: string
 *           description: Channel ID (C1234567890) or channel name (#general)
 *           example: C1234567890
 *         text:
 *           type: string
 *           description: Message text
 *           example: Hello, world!
 *         thread_ts:
 *           type: string
 *           description: Thread timestamp to reply to
 *           example: 1234567890.123456
 *         blocks:
 *           type: array
 *           description: Block Kit message blocks
 *           items:
 *             type: object
 *         attachments:
 *           type: array
 *           description: Legacy message attachments
 *           items:
 *             type: object
 *     
 *     BulkMessageRequest:
 *       type: object
 *       required:
 *         - messages
 *       properties:
 *         messages:
 *           type: array
 *           minItems: 1
 *           maxItems: 50
 *           items:
 *             $ref: '#/components/schemas/SendMessageRequest'
 */

/**
 * @swagger
 * /api/slack/channels:
 *   get:
 *     summary: List Slack channels
 *     description: Retrieve a list of all channels in the Slack workspace
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include archived channels
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 100
 *         description: Maximum number of channels to return
 *     responses:
 *       200:
 *         description: List of channels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SlackChannel'
 *                 count:
 *                   type: integer
 *                   example: 42
 *                 requestId:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/slack/channels/sync:
 *   post:
 *     summary: Sync channels from Slack
 *     description: Fetch the latest channel list from Slack and update local cache
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Channels synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Channels synced successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SlackChannel'
 *                 count:
 *                   type: integer
 *                   example: 42
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/slack/channels/search:
 *   get:
 *     summary: Search channels by name
 *     description: Search for channels matching the given query
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query
 *         example: general
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SlackChannel'
 *                 count:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /api/slack/channels/{channelId}/messages:
 *   get:
 *     summary: Get channel messages
 *     description: Retrieve recent messages from a specific channel
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[CG][A-Z0-9]+$'
 *         description: Slack channel ID
 *         example: C1234567890
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 20
 *         description: Number of messages to retrieve
 *     responses:
 *       200:
 *         description: Channel messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SlackMessage'
 *                 count:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Channel not found
 */

/**
 * @swagger
 * /api/slack/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a message to a Slack channel
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Message sent successfully
 *                 data:
 *                   $ref: '#/components/schemas/SlackMessage'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/slack/messages/bulk:
 *   post:
 *     summary: Send multiple messages
 *     description: Send messages to multiple channels in a single request
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkMessageRequest'
 *     responses:
 *       200:
 *         description: Bulk send results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     successful:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                       channel:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [fulfilled, rejected]
 *                       data:
 *                         $ref: '#/components/schemas/SlackMessage'
 *                       error:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/slack/users:
 *   get:
 *     summary: List Slack users
 *     description: Retrieve a list of all users in the Slack workspace
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *         description: Maximum number of users to return
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SlackUser'
 *                 count:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/slack/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve details of a specific Slack user
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[UW][A-Z0-9]+$'
 *         description: Slack user ID
 *         example: U1234567890
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SlackUser'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/slack/bot:
 *   get:
 *     summary: Get bot information
 *     description: Retrieve information about the connected Slack bot
 *     tags: [Slack]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bot information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SlackBotInfo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/slack/webhooks/events:
 *   post:
 *     summary: Handle Slack events
 *     description: Webhook endpoint for Slack event subscriptions
 *     tags: [Slack]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-Slack-Request-Timestamp
 *         required: true
 *         schema:
 *           type: string
 *         description: Slack request timestamp
 *       - in: header
 *         name: X-Slack-Signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Slack request signature
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [url_verification, event_callback]
 *               challenge:
 *                 type: string
 *                 description: Challenge string for URL verification
 *               event:
 *                 type: object
 *                 description: Event payload
 *     responses:
 *       200:
 *         description: Event received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challenge:
 *                   type: string
 *                   description: Challenge response for URL verification
 *       403:
 *         description: Invalid signature
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /api/slack/webhooks/slash-commands:
 *   post:
 *     summary: Handle slash commands
 *     description: Webhook endpoint for Slack slash commands
 *     tags: [Slack]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-Slack-Request-Timestamp
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Slack-Signature
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               command:
 *                 type: string
 *                 example: /duetright
 *               text:
 *                 type: string
 *                 example: help
 *               user_id:
 *                 type: string
 *               user_name:
 *                 type: string
 *               channel_id:
 *                 type: string
 *               channel_name:
 *                 type: string
 *               team_id:
 *                 type: string
 *               team_domain:
 *                 type: string
 *               response_url:
 *                 type: string
 *               trigger_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Command response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response_type:
 *                   type: string
 *                   enum: [in_channel, ephemeral]
 *                 text:
 *                   type: string
 *                 blocks:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Invalid signature
 */