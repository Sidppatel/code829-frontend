import { z } from 'zod';

export const createEventSchema = z
  .object({
    title: z.string().min(3, 'Title is required').max(200),
    description: z.string().max(5000).optional().or(z.literal('')),
    category: z.string().min(1, 'Category is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    venueId: z.string().uuid('Select a venue'),
    isFeatured: z.boolean().optional(),
    layoutMode: z.enum(['open', 'tables']),
    maxCapacity: z.number().int().positive().optional(),
    bannerImageUrl: z.string().url().optional().or(z.literal('')),
    pricePerPersonCents: z.number().int().nonnegative().optional(),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'End must be after start',
    path: ['endDate'],
  });
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.string().optional(),
});
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
